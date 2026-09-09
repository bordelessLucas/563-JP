import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { Cart } from "@/src/types/checkout";
import {
  DeliveryStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StatusHistoryEntry,
} from "@/src/types/order";

const database = getFirestore(firebaseApp);

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
    payment: data.payment
      ? (data.payment as Order["payment"])
      : undefined,
    delivery: data.delivery
      ? (data.delivery as Order["delivery"])
      : undefined,
    deliveryCreationState: data.deliveryCreationState
      ? String(data.deliveryCreationState)
      : undefined,
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

/**
 * @deprecated Client-side status advances are forbidden.
 * Use Cloud Functions callables (markOrderPreparing, markOrderReady, requestDelivery, …).
 */
export async function advanceOrderStatus(
  _orderId: string,
  _nextOrderStatus: OrderStatus,
  _adminId: string,
): Promise<Order> {
  throw new Error(
    "Avanço de status pelo app foi desativado. Use as ações do backend (preparar / pronto / solicitar entrega).",
  );
}

/** Informational only — critical transitions are enforced server-side. */
export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  if (current === "paid") return "preparing";
  if (current === "preparing") return "ready_for_pickup";
  return null;
}

/**
 * @deprecated Prefer backend createCheckout + simulateMockPayment.
 * Kept only for emergency local demos; Firestore rules now block client creates.
 */
export async function createOrderFromCart(input: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  cart: Cart;
  paymentMethod: PaymentMethod;
}): Promise<Order> {
  throw new Error(
    "Criação de pedido pelo app foi desativada. Use o checkout via backend (Cloud Functions).",
  );
}
