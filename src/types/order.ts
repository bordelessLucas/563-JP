export type PaymentMethod = "pix" | "card";

export type PaymentStatus = "pending_payment" | "paid" | "failed";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "not_started"
  | "delivery_requested"
  | "driver_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export type OrderItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  message: string;
};

export type OrderRecipient = {
  name: string;
  phone: string;
  notes: string;
};

export type OrderAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
};

export type StatusHistoryEntry = {
  field: "paymentStatus" | "orderStatus" | "deliveryStatus";
  status: string;
  at: string;
  by: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  recipient: OrderRecipient;
  deliveryAddress: OrderAddress;
  deliveryDate: string;
  deliveryPeriodId: string;
  deliveryPeriodLabel: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  createdAt?: string;
  updatedAt?: string;
  statusHistory: StatusHistoryEntry[];
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "paid",
  "preparing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];

export const DELIVERY_STATUS_BY_ORDER: Partial<
  Record<OrderStatus, DeliveryStatus>
> = {
  paid: "not_started",
  preparing: "not_started",
  ready_for_delivery: "delivery_requested",
  out_for_delivery: "in_transit",
  delivered: "delivered",
};
