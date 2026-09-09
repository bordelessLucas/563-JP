import { getFunctions, httpsCallable } from "firebase/functions";

import { firebaseApp } from "@/src/services/firebase";

const functions = getFunctions(firebaseApp);

async function call<TReq extends object, TRes>(
  name: string,
  data: TReq,
): Promise<TRes> {
  const callable = httpsCallable(functions, name);
  const result = await callable(data);
  return result.data as TRes;
}

export type BackendDeliveryQuote = {
  provider: string;
  quoteId: string;
  feeCents: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
};

export type BackendCheckoutResult = {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  quote: BackendDeliveryQuote;
  quoteRefreshed: boolean;
  paymentSession: {
    paymentId: string;
    status: string;
    pixCopyPaste?: string;
  };
};

export function createDeliveryQuote(input: {
  address: Record<string, unknown>;
  persistToCart?: boolean;
}) {
  return call<typeof input, { quote: BackendDeliveryQuote }>(
    "createDeliveryQuote",
    input,
  );
}

export function createCheckout(input: {
  customerName: string;
  customerEmail: string;
  paymentMethod: "pix" | "card";
  recipient: { name: string; phone: string; notes?: string };
  address: Record<string, unknown>;
  items: Array<{ productId: string; quantity: number; message?: string }>;
  deliveryDate: string;
  deliveryPeriodId: string;
  deliveryPeriodLabel: string;
  deliveryNotes?: string;
  existingQuote?: BackendDeliveryQuote;
}) {
  return call<typeof input, BackendCheckoutResult>("createCheckout", input);
}

export function simulateMockPayment(input: {
  orderId: string;
  outcome: "approved" | "failed" | "cancelled" | "pending";
}) {
  return call<typeof input, { orderId: string; paymentStatus: string }>(
    "simulateMockPayment",
    input,
  );
}

export function markOrderPreparing(orderId: string) {
  return call<{ orderId: string }, { orderId: string; orderStatus: string }>(
    "markOrderPreparing",
    { orderId },
  );
}

export function markOrderReady(orderId: string) {
  return call<{ orderId: string }, { orderId: string; orderStatus: string }>(
    "markOrderReady",
    { orderId },
  );
}

export function requestDelivery(orderId: string) {
  return call<
    { orderId: string },
    { orderId: string; deliveryId?: string; duplicated?: boolean }
  >("requestDelivery", { orderId });
}

export function retryDelivery(orderId: string) {
  return call<{ orderId: string }, { orderId: string; deliveryId?: string }>(
    "retryDelivery",
    { orderId },
  );
}

export function reconcileDelivery(orderId: string) {
  return call<{ orderId: string }, { orderId: string }>(
    "reconcileDelivery",
    { orderId },
  );
}

export function cancelOrder(orderId: string, reason?: string) {
  return call<
    { orderId: string; reason?: string },
    { orderId: string; refunded: boolean }
  >("cancelOrder", { orderId, reason });
}
