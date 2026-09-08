import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { Cart } from "@/src/types/checkout";
import {
  DELIVERY_STATUS_BY_ORDER,
  DeliveryStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StatusHistoryEntry,
} from "@/src/types/order";

const database = getFirestore(firebaseApp);

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

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    orderNumber: String(data.orderNumber ?? id),
    customerId: String(data.customerId ?? ""),
    customerName: String(data.customerName ?? ""),
    customerEmail: String(data.customerEmail ?? ""),
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
    recipient: (data.recipient as Order["recipient"]) ?? {
      name: "",
      phone: "",
      notes: "",
    },
    deliveryAddress: (data.deliveryAddress as Order["deliveryAddress"]) ?? {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      reference: "",
    },
    deliveryDate: String(data.deliveryDate ?? ""),
    deliveryPeriodId: String(data.deliveryPeriodId ?? ""),
    deliveryPeriodLabel: String(data.deliveryPeriodLabel ?? ""),
    subtotal: Number(data.subtotal ?? 0),
    deliveryFee: Number(data.deliveryFee ?? 0),
    total: Number(data.total ?? 0),
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? "pix",
    paymentStatus: (data.paymentStatus as PaymentStatus) ?? "pending_payment",
    orderStatus: (data.orderStatus as OrderStatus) ?? "pending_payment",
    deliveryStatus: (data.deliveryStatus as DeliveryStatus) ?? "not_started",
    createdAt:
      typeof data.createdAt === "object" &&
      data.createdAt &&
      "toDate" in data.createdAt
        ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
        : typeof data.createdAt === "string"
          ? data.createdAt
          : undefined,
    updatedAt:
      typeof data.updatedAt === "object" &&
      data.updatedAt &&
      "toDate" in data.updatedAt
        ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : typeof data.updatedAt === "string"
          ? data.updatedAt
          : undefined,
    statusHistory: Array.isArray(data.statusHistory)
      ? (data.statusHistory as StatusHistoryEntry[])
      : [],
  };
}

export async function createOrderFromCart(input: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  cart: Cart;
  paymentMethod: PaymentMethod;
}): Promise<Order> {
  const { cart, paymentMethod } = input;
  if (!cart.checkout?.address || !cart.checkout.recipient) {
    throw new Error("Checkout incompleto para criar o pedido.");
  }
  if (
    !cart.checkout.deliveryDate?.trim() ||
    !cart.checkout.deliveryPeriodId?.trim() ||
    !cart.checkout.deliveryPeriodLabel?.trim()
  ) {
    throw new Error("Informe data e período de entrega antes de pagar.");
  }
  if (
    !cart.checkout.recipient.name.trim() ||
    !cart.checkout.address.street.trim() ||
    !cart.checkout.address.number.trim()
  ) {
    throw new Error("Destinatário ou endereço incompletos.");
  }
  if (cart.items.length === 0) {
    throw new Error("Carrinho vazio.");
  }

  const nowIso = new Date().toISOString();
  const history: StatusHistoryEntry[] = [
    {
      field: "paymentStatus",
      status: "paid",
      at: nowIso,
      by: input.customerId,
    },
    {
      field: "orderStatus",
      status: "paid",
      at: nowIso,
      by: input.customerId,
    },
    {
      field: "deliveryStatus",
      status: "not_started",
      at: nowIso,
      by: input.customerId,
    },
  ];

  const payload = {
    orderNumber: buildOrderNumber(),
    customerId: input.customerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    items: cart.items,
    recipient: cart.checkout.recipient,
    deliveryAddress: {
      cep: cart.checkout.address.cep,
      street: cart.checkout.address.street,
      number: cart.checkout.address.number,
      complement: cart.checkout.address.complement,
      neighborhood: cart.checkout.address.neighborhood,
      city: cart.checkout.address.city,
      state: cart.checkout.address.state,
      reference: cart.checkout.address.reference,
    },
    deliveryDate: cart.checkout.deliveryDate,
    deliveryPeriodId: cart.checkout.deliveryPeriodId,
    deliveryPeriodLabel: cart.checkout.deliveryPeriodLabel,
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
    paymentMethod,
    paymentStatus: "paid" as PaymentStatus,
    orderStatus: "paid" as OrderStatus,
    deliveryStatus: "not_started" as DeliveryStatus,
    statusHistory: history,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reference = await addDoc(collection(database, "orders"), payload);
  return mapOrder(reference.id, {
    ...payload,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const snapshot = await getDoc(doc(database, "orders", orderId));
  if (!snapshot.exists()) return null;
  return mapOrder(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function listOrdersByCustomer(
  customerId: string,
): Promise<Order[]> {
  const snapshot = await getDocs(
    query(
      collection(database, "orders"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snapshot.docs.map((item) =>
    mapOrder(item.id, item.data() as Record<string, unknown>),
  );
}

export async function listAllOrders(): Promise<Order[]> {
  const snapshot = await getDocs(
    query(collection(database, "orders"), orderBy("createdAt", "desc")),
  );
  return snapshot.docs.map((item) =>
    mapOrder(item.id, item.data() as Record<string, unknown>),
  );
}

export async function advanceOrderStatus(
  orderId: string,
  nextOrderStatus: OrderStatus,
  adminId: string,
): Promise<Order> {
  const current = await getOrderById(orderId);
  if (!current) throw new Error("Pedido não encontrado.");

  const nowIso = new Date().toISOString();
  const nextDelivery =
    DELIVERY_STATUS_BY_ORDER[nextOrderStatus] ?? current.deliveryStatus;

  const history: StatusHistoryEntry[] = [
    ...current.statusHistory,
    {
      field: "orderStatus",
      status: nextOrderStatus,
      at: nowIso,
      by: adminId,
    },
    {
      field: "deliveryStatus",
      status: nextDelivery,
      at: nowIso,
      by: adminId,
    },
  ];

  await updateDoc(doc(database, "orders", orderId), {
    orderStatus: nextOrderStatus,
    deliveryStatus: nextDelivery,
    statusHistory: history,
    updatedAt: serverTimestamp(),
  });

  return {
    ...current,
    orderStatus: nextOrderStatus,
    deliveryStatus: nextDelivery,
    statusHistory: history,
    updatedAt: nowIso,
  };
}

export function nextOrderStatus(
  current: OrderStatus,
): OrderStatus | null {
  const index = [
    "paid",
    "preparing",
    "ready_for_delivery",
    "out_for_delivery",
    "delivered",
  ].indexOf(current);
  if (index < 0 || index >= 4) return null;
  return [
    "paid",
    "preparing",
    "ready_for_delivery",
    "out_for_delivery",
    "delivered",
  ][index + 1] as OrderStatus;
}
