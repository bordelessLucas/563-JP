import * as admin from "firebase-admin";

import {
  canSimulateMockPayment,
  getPaymentProviderId,
} from "../config";
import {
  assertOrderTransition,
} from "../domain/orderStateMachine";
import {
  DeliveryQuote,
  NormalizedAddress,
  OrderDocument,
  OrderStatus,
} from "../domain/types";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { deliveryService, isAmbiguousDeliveryError } from "./DeliveryService";
import { geocodingService } from "./GeocodingService";
import { paymentService } from "./PaymentService";
import {
  buildPricing,
  loadStoreConfig,
  priceCartItems,
} from "./PricingService";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function buildOrderNumber(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    `${now.getMonth() + 1}`.padStart(2, "0"),
    `${now.getDate()}`.padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JP-${stamp}-${suffix}`;
}

function audit(type: string, by: string, meta?: Record<string, unknown>) {
  return {
    type,
    at: new Date().toISOString(),
    by,
    meta: meta ?? {},
  };
}

async function requireAdmin(
  uid: string,
  token?: { admin?: unknown } | null,
) {
  if (token?.admin === true) return;
  const user = await db.doc(`users/${uid}`).get();
  if (!user.exists || user.data()?.role !== "admin") {
    throw new AppError({
      code: "forbidden",
      message: "Admin required",
      publicMessage: "Acesso restrito.",
      status: 403,
    });
  }
}

/** Central ownership check — never trust client-sent isAdmin flags. */
export async function requireOrderAccess(
  uid: string,
  order: OrderDocument,
  options?: { adminOnly?: boolean; token?: { admin?: unknown } | null },
) {
  if (options?.adminOnly) {
    await requireAdmin(uid, options?.token);
    return;
  }
  if (order.customerId === uid) return;
  await requireAdmin(uid, options?.token);
}

export async function createDeliveryQuote(input: {
  uid: string;
  address: Parameters<typeof geocodingService.normalize>[0];
  persistToCart?: boolean;
}) {
  const dropoff = geocodingService.normalize(input.address);
  const store = await loadStoreConfig();
  const quote = await deliveryService.createQuote({ pickup: store, dropoff });

  if (input.persistToCart) {
    await db.doc(`carts/${input.uid}`).set(
      {
        checkout: {
          deliveryQuote: quote,
          address: dropoff,
        },
        deliveryFee: quote.feeCents / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  logger.info("order.quote.created", {
    orderHint: input.uid,
    quoteId: quote.quoteId,
    feeCents: quote.feeCents,
  });

  return { quote, dropoff };
}

export async function createCheckout(input: {
  uid: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: "pix" | "card";
  recipient: { name: string; phone: string; notes?: string };
  address: Parameters<typeof geocodingService.normalize>[0];
  items: Array<{ productId: string; quantity: number; message?: string }>;
  deliveryDate: string;
  deliveryPeriodId: string;
  deliveryPeriodLabel: string;
  deliveryType?: "asap" | "scheduled";
  deliveryNotes?: string;
  existingQuote?: DeliveryQuote;
}) {
  if (!input.recipient?.name?.trim() || !input.recipient?.phone?.trim()) {
    throw new AppError({
      code: "invalid_recipient",
      message: "Recipient incomplete",
      publicMessage: "Informe nome e telefone do destinatário.",
      status: 400,
    });
  }
  if (
    !input.deliveryDate?.trim() ||
    !input.deliveryPeriodId?.trim() ||
    !input.deliveryPeriodLabel?.trim()
  ) {
    throw new AppError({
      code: "invalid_schedule",
      message: "Schedule incomplete",
      publicMessage: "Informe data e período de entrega.",
      status: 400,
    });
  }

  const dropoff = geocodingService.normalize(input.address);
  const { items, subtotalCents } = await priceCartItems(input.items);
  const store = await loadStoreConfig();

  // Never trust client or cart-stored feeCents (carts are client-writable).
  // Always re-quote from the delivery provider at checkout time.
  const previousHint = input.existingQuote;
  const quote = await deliveryService.createQuote({
    pickup: store,
    dropoff,
  });
  const quoteRefreshed = Boolean(
    previousHint &&
      (deliveryService.isQuoteExpired(previousHint) ||
        previousHint.feeCents !== quote.feeCents),
  );

  const { pricing, subtotal, deliveryFee, total } = buildPricing({
    subtotalCents,
    deliveryFeeCents: quote.feeCents,
    discountCents: 0,
  });

  const orderRef = db.collection("orders").doc();
  const orderNumber = buildOrderNumber();

  const paymentSession = await paymentService.createPayment({
    orderId: orderRef.id,
    amountCents: pricing.totalCents,
    currency: "BRL",
    method: input.paymentMethod,
    customer: {
      id: input.uid,
      name: input.customerName,
      email: input.customerEmail,
    },
    description: `Pedido ${orderNumber}`,
  });

  const now = new Date().toISOString();
  const order: OrderDocument = {
    orderNumber,
    customerId: input.uid,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    buyer: {
      id: input.uid,
      name: input.customerName,
      email: input.customerEmail,
    },
    recipient: {
      name: input.recipient.name.trim(),
      phone: input.recipient.phone.trim(),
      notes: input.recipient.notes?.trim() || "",
    },
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      message: item.message,
    })),
    deliveryAddress: dropoff,
    deliveryDate: input.deliveryDate,
    deliveryPeriodId: input.deliveryPeriodId,
    deliveryPeriodLabel: input.deliveryPeriodLabel,
    deliveryType: input.deliveryType ?? "scheduled",
    requestedDeliveryDate: input.deliveryDate,
    requestedDeliveryWindow: input.deliveryPeriodLabel,
    deliveryNotes: input.deliveryNotes,
    pickupNotes: `Pedido ${orderNumber}. Preparação ~${store.preparationMinutes} min.`,
    pricing,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending_payment",
    orderStatus: "awaiting_payment",
    deliveryStatus: "not_started",
    payment: {
      provider: getPaymentProviderId(),
      externalPaymentId: paymentSession.paymentId,
      status: paymentSession.status,
      amountCents: paymentSession.amountCents,
      currency: "BRL",
      method: input.paymentMethod,
      createdAt: paymentSession.createdAt,
    },
    deliveryQuote: quote,
    deliveryCreationState: "not_started",
    statusHistory: [
      {
        field: "orderStatus",
        status: "awaiting_payment",
        at: now,
        by: input.uid,
      },
      {
        field: "paymentStatus",
        status: "pending_payment",
        at: now,
        by: input.uid,
      },
    ],
    auditLog: [
      audit("ORDER_CREATED", input.uid, { orderNumber }),
      audit("DELIVERY_QUOTED", input.uid, {
        quoteId: quote.quoteId,
        feeCents: quote.feeCents,
      }),
      audit("PAYMENT_CREATED", input.uid, {
        paymentId: paymentSession.paymentId,
      }),
    ],
  };

  await orderRef.set({
    ...order,
    // store unitPrice decimal mirror for legacy UI cards
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPriceCents / 100,
    })),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.doc(`carts/${input.uid}`).set(
    {
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      checkout: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  logger.info("order.checkout.created", {
    orderId: orderRef.id,
    quoteRefreshed,
  });

  return {
    orderId: orderRef.id,
    orderNumber,
    pricing,
    subtotal,
    deliveryFee,
    total,
    quote,
    quoteRefreshed,
    paymentSession,
  };
}

export async function simulateMockPayment(input: {
  uid: string;
  orderId: string;
  outcome: "approved" | "failed" | "cancelled" | "pending";
}) {
  if (!canSimulateMockPayment()) {
    throw new AppError({
      code: "simulation_forbidden",
      message: "Mock payment simulation disabled (fail-closed)",
      publicMessage: "Simulação indisponível neste ambiente.",
      status: 403,
    });
  }

  const ref = db.doc(`orders/${input.orderId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError({
      code: "order_not_found",
      message: "Order not found",
      publicMessage: "Pedido não encontrado.",
      status: 404,
    });
  }
  const order = snap.data() as OrderDocument;
  await requireOrderAccess(input.uid, order);

  const paymentId = order.payment?.externalPaymentId;
  if (!paymentId) {
    throw new AppError({
      code: "payment_missing",
      message: "Order has no payment id",
      publicMessage: "Pagamento não encontrado para este pedido.",
      status: 409,
    });
  }

  const status = await paymentService.simulateMockStatus(
    paymentId,
    input.outcome,
  );

  if (status === "approved") {
    await markOrderPaid(input.orderId, "mock_simulator");
  } else if (status === "failed" || status === "cancelled") {
    await ref.update({
      paymentStatus: "failed",
      "payment.status": status,
      orderStatus: "exception",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        field: "paymentStatus",
        status: "failed",
        at: new Date().toISOString(),
        by: input.uid,
      }),
      auditLog: admin.firestore.FieldValue.arrayUnion(
        audit("PAYMENT_FAILED", input.uid, { status }),
      ),
    });
  } else {
    await ref.update({
      "payment.status": status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { orderId: input.orderId, paymentStatus: status };
}

export async function markOrderPaid(orderId: string, by: string) {
  const ref = db.doc(`orders/${orderId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new AppError({
        code: "order_not_found",
        message: "Order not found",
        publicMessage: "Pedido não encontrado.",
        status: 404,
      });
    }
    const order = snap.data() as OrderDocument;
    if (order.payment?.status === "approved" && order.orderStatus === "paid") {
      return;
    }
    assertOrderTransition(order.orderStatus, "paid");
    const now = new Date().toISOString();
    tx.update(ref, {
      orderStatus: "paid",
      paymentStatus: "paid",
      "payment.status": "approved",
      "payment.approvedAt": now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion(
        {
          field: "orderStatus",
          status: "paid",
          at: now,
          by,
        },
        {
          field: "paymentStatus",
          status: "paid",
          at: now,
          by,
        },
      ),
      auditLog: admin.firestore.FieldValue.arrayUnion(
        audit("PAYMENT_APPROVED", by),
      ),
    });
  });
}

export async function markOrderPreparing(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  await requireAdmin(uid, token);
  return transitionOrder(orderId, "preparing", uid, "ORDER_PREPARING");
}

export async function markOrderReady(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  await requireAdmin(uid, token);
  return transitionOrder(orderId, "ready_for_pickup", uid, "ORDER_READY");
}

async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  by: string,
  auditType: string,
) {
  const ref = db.doc(`orders/${orderId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new AppError({
        code: "order_not_found",
        message: "Order not found",
        publicMessage: "Pedido não encontrado.",
        status: 404,
      });
    }
    const order = snap.data() as OrderDocument;
    assertOrderTransition(order.orderStatus, to);
    const now = new Date().toISOString();
    tx.update(ref, {
      orderStatus: to,
      // keep legacy alias for UI that still expects ready_for_delivery
      ...(to === "ready_for_pickup"
        ? { legacyReadyAlias: "ready_for_delivery" }
        : {}),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        field: "orderStatus",
        status: to,
        at: now,
        by,
      }),
      auditLog: admin.firestore.FieldValue.arrayUnion(audit(auditType, by)),
    });
  });
  return { orderId, orderStatus: to };
}

export async function requestDelivery(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  await requireAdmin(uid, token);
  const ref = db.doc(`orders/${orderId}`);

  // Atomic lock — only from not_started | failed while ready_for_pickup
  const locked = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new AppError({
        code: "order_not_found",
        message: "Order not found",
        publicMessage: "Pedido não encontrado.",
        status: 404,
      });
    }
    const order = snap.data() as OrderDocument;
    if (order.payment?.status !== "approved") {
      throw new AppError({
        code: "PAYMENT_NOT_APPROVED",
        message: "Cannot create delivery before payment.status === approved",
        publicMessage: "O pagamento ainda não foi confirmado.",
        status: 409,
      });
    }
    if (
      order.deliveryCreationState === "created" &&
      order.delivery?.externalDeliveryId
    ) {
      return { alreadyCreated: true as const, order };
    }
    if (order.deliveryCreationState === "creating") {
      throw new AppError({
        code: "DELIVERY_CREATION_IN_PROGRESS",
        message: "Delivery creation already in progress",
        publicMessage: "A solicitação de entrega já está em andamento.",
        status: 409,
      });
    }
    if (order.deliveryCreationState === "uncertain") {
      throw new AppError({
        code: "DELIVERY_CREATION_UNCERTAIN",
        message: "Previous create is ambiguous — reconcile before retry",
        publicMessage:
          "A última tentativa ficou inconclusiva. Use reconciliar antes de tentar de novo.",
        status: 409,
      });
    }
    const operationalReady =
      order.orderStatus === "ready_for_pickup" ||
      order.orderStatus === "ready_for_delivery";
    if (!operationalReady) {
      throw new AppError({
        code: "ORDER_NOT_READY",
        message: `Order status ${order.orderStatus} cannot request delivery`,
        publicMessage:
          "O pedido precisa estar pronto para coleta antes de solicitar o entregador.",
        status: 409,
      });
    }
    const creationState = order.deliveryCreationState ?? "not_started";
    if (creationState !== "not_started" && creationState !== "failed") {
      throw new AppError({
        code: "DELIVERY_ALREADY_EXISTS",
        message: `Cannot request delivery from state ${creationState}`,
        publicMessage: "Não é possível solicitar entrega neste estado.",
        status: 409,
      });
    }
    tx.update(ref, {
      deliveryCreationState: "creating",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { alreadyCreated: false as const, order };
  });

  if (locked.alreadyCreated) {
    return {
      orderId,
      deliveryId: locked.order.delivery?.externalDeliveryId,
      duplicated: true,
    };
  }

  let quote = locked.order.deliveryQuote;
  const store = await loadStoreConfig();
  const dropoff = locked.order.deliveryAddress as NormalizedAddress;

  try {
    if (!quote || deliveryService.isQuoteExpired(quote)) {
      const refreshed = await deliveryService.createQuote({
        pickup: store,
        dropoff,
      });
      if (
        locked.order.deliveryQuote &&
        locked.order.deliveryQuote.feeCents !== refreshed.feeCents
      ) {
        await ref.update({
          deliveryCreationState: "failed",
          "delivery.lastError": "quote_fee_changed_after_payment",
          orderStatus: "exception",
          "delivery.proposedQuoteId": refreshed.quoteId,
          "delivery.proposedFeeCents": refreshed.feeCents,
          auditLog: admin.firestore.FieldValue.arrayUnion(
            audit("DELIVERY_QUOTE_FEE_CHANGED", uid, {
              previousFeeCents: locked.order.deliveryQuote.feeCents,
              nextFeeCents: refreshed.feeCents,
            }),
          ),
        });
        throw new AppError({
          code: "QUOTE_EXPIRED",
          message: "Delivery fee changed after payment",
          publicMessage:
            "O frete mudou após o pagamento. Revise o pedido no painel antes de solicitar a entrega.",
          status: 409,
          details: {
            previousFeeCents: locked.order.deliveryQuote.feeCents,
            nextFeeCents: refreshed.feeCents,
          },
        });
      }
      quote = refreshed;
      await ref.update({
        deliveryQuote: quote,
        deliveryFee: quote.feeCents / 100,
        "pricing.deliveryFeeCents": quote.feeCents,
        "pricing.totalCents":
          locked.order.pricing.subtotalCents +
          quote.feeCents -
          (locked.order.pricing.discountCents ?? 0),
        total:
          (locked.order.pricing.subtotalCents +
            quote.feeCents -
            (locked.order.pricing.discountCents ?? 0)) /
          100,
        auditLog: admin.firestore.FieldValue.arrayUnion(
          audit("DELIVERY_QUOTED", uid, {
            quoteId: quote.quoteId,
            refreshed: true,
          }),
        ),
      });
    }

    const delivery = await deliveryService.createDelivery({
      quoteId: quote.quoteId,
      pickup: store,
      dropoff,
      recipientName: locked.order.recipient.name,
      recipientPhone: locked.order.recipient.phone,
      pickupNotes: locked.order.pickupNotes,
      dropoffNotes: locked.order.deliveryNotes || locked.order.recipient.notes,
      externalOrderId: orderId,
      idempotencyKey: orderId,
      manifestItems: locked.order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        size: "small" as const,
        priceCents: item.unitPriceCents,
      })),
    });

    assertOrderTransition(
      locked.order.orderStatus === "ready_for_delivery"
        ? "ready_for_pickup"
        : locked.order.orderStatus,
      "delivery_requested",
    );

    const now = new Date().toISOString();
    await ref.update({
      deliveryCreationState: "created",
      orderStatus: "delivery_requested",
      deliveryStatus: "delivery_requested",
      delivery: {
        provider: delivery.provider,
        quoteId: quote.quoteId,
        quoteFeeCents: quote.feeCents,
        quoteExpiresAt: quote.expiresAt,
        externalDeliveryId: delivery.externalDeliveryId,
        status: delivery.status,
        trackingUrl: delivery.trackingUrl,
        pickupEta: delivery.pickupEta,
        dropoffEta: delivery.dropoffEta,
        courier: delivery.courier,
        createdAt: now,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        field: "orderStatus",
        status: "delivery_requested",
        at: now,
        by: uid,
      }),
      auditLog: admin.firestore.FieldValue.arrayUnion(
        audit("UBER_DELIVERY_REQUESTED", uid, {
          deliveryId: delivery.externalDeliveryId,
        }),
      ),
    });

    return { orderId, deliveryId: delivery.externalDeliveryId, duplicated: false };
  } catch (error) {
    const ambiguous =
      isAmbiguousDeliveryError(error) ||
      (error instanceof AppError && error.code === "DELIVERY_CREATION_UNCERTAIN");
    const message = error instanceof Error ? error.message : "unknown";

    if (ambiguous) {
      await ref.update({
        deliveryCreationState: "uncertain",
        "delivery.lastError": message.slice(0, 300),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        auditLog: admin.firestore.FieldValue.arrayUnion(
          audit("DELIVERY_CREATE_UNCERTAIN", uid, {
            message: message.slice(0, 200),
          }),
        ),
      });
      throw new AppError({
        code: "DELIVERY_CREATION_UNCERTAIN",
        message,
        publicMessage:
          "A solicitação de entrega ficou inconclusiva. Reconcilie antes de tentar novamente.",
        status: 502,
      });
    }

    await ref.update({
      deliveryCreationState: "failed",
      "delivery.lastError": message.slice(0, 300),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      auditLog: admin.firestore.FieldValue.arrayUnion(
        audit("DELIVERY_CREATE_FAILED", uid, { message: message.slice(0, 200) }),
      ),
    });
    // Keep orderStatus at ready_for_pickup so retry remains possible.
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "delivery_create_failed",
      message,
      publicMessage:
        "Pagamento confirmado, mas a entrega não pôde ser solicitada. Use retry após revisar.",
      status: 502,
    });
  }
}

export async function retryDelivery(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  await requireAdmin(uid, token);
  const snap = await db.doc(`orders/${orderId}`).get();
  if (!snap.exists) {
    throw new AppError({
      code: "order_not_found",
      message: "Order not found",
      publicMessage: "Pedido não encontrado.",
      status: 404,
    });
  }
  const order = snap.data() as OrderDocument;

  if (order.deliveryCreationState === "uncertain") {
    throw new AppError({
      code: "DELIVERY_CREATION_UNCERTAIN",
      message: "Must reconcile before retry",
      publicMessage:
        "Estado inconclusivo. Execute reconciliar entrega antes do retry.",
      status: 409,
    });
  }

  if (order.delivery?.externalDeliveryId) {
    return reconcileDelivery(uid, orderId, token);
  }

  if (order.payment?.status !== "approved") {
    throw new AppError({
      code: "PAYMENT_NOT_APPROVED",
      message: "Payment not approved",
      publicMessage: "O pagamento ainda não foi confirmado.",
      status: 409,
    });
  }

  if (
    order.orderStatus !== "ready_for_pickup" &&
    order.orderStatus !== "ready_for_delivery"
  ) {
    throw new AppError({
      code: "ORDER_NOT_READY",
      message: "Retry requires ready_for_pickup",
      publicMessage: "Marque o pedido como pronto antes de tentar novamente.",
      status: 409,
    });
  }

  if (order.deliveryCreationState === "creating") {
    throw new AppError({
      code: "DELIVERY_CREATION_IN_PROGRESS",
      message: "Still creating",
      publicMessage: "Aguarde a tentativa atual finalizar.",
      status: 409,
    });
  }

  if (order.deliveryCreationState !== "failed") {
    throw new AppError({
      code: "retry_not_allowed",
      message: `Retry only from failed (got ${order.deliveryCreationState})`,
      publicMessage: "Retry só é permitido após falha confirmada de criação.",
      status: 409,
    });
  }

  await db.doc(`orders/${orderId}`).update({
    deliveryCreationState: "not_started",
  });
  return requestDelivery(uid, orderId, token);
}

export async function reconcileDelivery(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  await requireAdmin(uid, token);
  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError({
      code: "order_not_found",
      message: "Order not found",
      publicMessage: "Pedido não encontrado.",
      status: 404,
    });
  }
  const order = snap.data() as OrderDocument;
  let deliveryId = order.delivery?.externalDeliveryId;

  if (!deliveryId) {
    // Ambiguous create may have succeeded at Uber without local id —
    // look up by external_id / idempotency (orderId) before allowing retry.
    const found = await deliveryService.findByExternalOrderId(orderId);
    if (found?.externalDeliveryId) {
      deliveryId = found.externalDeliveryId;
      await ref.update({
        deliveryCreationState: "created",
        orderStatus: "delivery_requested",
        deliveryStatus: "delivery_requested",
        delivery: {
          ...(order.delivery ?? {}),
          provider: found.provider,
          externalDeliveryId: found.externalDeliveryId,
          status: found.status,
          trackingUrl: found.trackingUrl ?? null,
          courier: found.courier ?? null,
          pickupEta: found.pickupEta ?? null,
          dropoffEta: found.dropoffEta ?? null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        auditLog: admin.firestore.FieldValue.arrayUnion(
          audit("DELIVERY_RECONCILED_BY_EXTERNAL_ID", uid, {
            deliveryId: found.externalDeliveryId,
          }),
        ),
      });
      return { orderId, delivery: found, deliveryId, recovered: true };
    }

    if (order.deliveryCreationState === "uncertain") {
      // Search found nothing — safe to mark failed. Retry uses idempotency_key=orderId.
      await ref.update({
        deliveryCreationState: "failed",
        "delivery.lastError":
          "uncertain_reconcile_no_delivery_found_safe_to_retry",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        auditLog: admin.firestore.FieldValue.arrayUnion(
          audit("DELIVERY_UNCERTAIN_CLEARED", uid, {
            note: "no_external_match",
          }),
        ),
      });
      return {
        orderId,
        recovered: false,
        clearedUncertain: true,
        message:
          "Nenhuma entrega Uber encontrada para este pedido. Estado marcado como falha; retry é seguro (idempotency_key).",
      };
    }

    throw new AppError({
      code: "delivery_missing",
      message: "No external delivery id",
      publicMessage: "Este pedido ainda não tem entrega externa.",
      status: 404,
    });
  }

  const current = await deliveryService.getDelivery(deliveryId);
  await ref.update({
    deliveryCreationState: "created",
    "delivery.status": current.status,
    "delivery.trackingUrl": current.trackingUrl ?? null,
    "delivery.courier": current.courier ?? null,
    "delivery.pickupEta": current.pickupEta ?? null,
    "delivery.dropoffEta": current.dropoffEta ?? null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    auditLog: admin.firestore.FieldValue.arrayUnion(
      audit("DELIVERY_RECONCILED", uid, { deliveryId }),
    ),
  });
  return { orderId, delivery: current, deliveryId, recovered: false };
}

export async function cancelOrder(
  uid: string,
  orderId: string,
  reason?: string,
  token?: { admin?: unknown } | null,
) {
  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError({
      code: "order_not_found",
      message: "Order not found",
      publicMessage: "Pedido não encontrado.",
      status: 404,
    });
  }
  const order = snap.data() as OrderDocument;
  const isOwner = order.customerId === uid;
  if (!isOwner) await requireAdmin(uid, token);

  if (["delivered", "cancelled", "returned"].includes(order.orderStatus)) {
    throw new AppError({
      code: "cancel_not_allowed",
      message: "Terminal order",
      publicMessage: "Este pedido não pode ser cancelado.",
      status: 409,
    });
  }

  // Before payment: cancel only
  if (
    order.payment?.status !== "approved" &&
    order.paymentStatus !== "paid"
  ) {
    assertOrderTransition(order.orderStatus, "cancelled");
    await ref.update({
      orderStatus: "cancelled",
      paymentStatus:
        order.paymentStatus === "pending_payment"
          ? "failed"
          : order.paymentStatus,
      "payment.status": "cancelled",
      deliveryStatus: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      auditLog: admin.firestore.FieldValue.arrayUnion(
        audit("ORDER_CANCELLED", uid, { reason, phase: "pre_payment" }),
      ),
    });
    return { orderId, refunded: false };
  }

  // After payment, maybe cancel uber
  if (order.delivery?.externalDeliveryId) {
    try {
      await deliveryService.cancelDelivery(order.delivery.externalDeliveryId);
    } catch (error) {
      await ref.update({
        orderStatus: "exception",
        "delivery.lastError":
          error instanceof Error ? error.message.slice(0, 300) : "cancel_failed",
        auditLog: admin.firestore.FieldValue.arrayUnion(
          audit("DELIVERY_CANCEL_FAILED", uid),
        ),
      });
      throw new AppError({
        code: "delivery_cancel_failed",
        message: "Could not cancel Uber delivery",
        publicMessage:
          "Não foi possível cancelar a entrega. O pedido ficou em exceção para revisão.",
        status: 502,
      });
    }
  }

  let refunded = false;
  if (order.payment?.externalPaymentId) {
    await paymentService.refundPayment(order.payment.externalPaymentId);
    refunded = true;
  }

  await ref.update({
    orderStatus: "cancelled",
    deliveryStatus: "cancelled",
    "payment.status": refunded ? "refunded" : "refund_pending",
    cancellation_pending: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    auditLog: admin.firestore.FieldValue.arrayUnion(
      audit("ORDER_CANCELLED", uid, { reason, refunded }),
      ...(refunded ? [audit("REFUNDED", uid)] : [audit("REFUND_REQUESTED", uid)]),
    ),
  });

  return { orderId, refunded };
}

export async function getOrderForUser(
  uid: string,
  orderId: string,
  token?: { admin?: unknown } | null,
) {
  const snap = await db.doc(`orders/${orderId}`).get();
  if (!snap.exists) {
    throw new AppError({
      code: "order_not_found",
      message: "Order not found",
      publicMessage: "Pedido não encontrado.",
      status: 404,
    });
  }
  const data = snap.data() as OrderDocument;
  await requireOrderAccess(uid, data, { token });
  return { id: snap.id, ...data };
}

export function quoteTtlMs() {
  return deliveryService.quoteTtlMs();
}

export function mapPaymentStatus(
  status: import("../domain/types").PaymentStatus,
) {
  if (status === "approved") return "paid" as const;
  if (status === "failed" || status === "cancelled") return "failed" as const;
  return "pending_payment" as const;
}

export { shouldApplyOrderStatus } from "../domain/orderStateMachine";
