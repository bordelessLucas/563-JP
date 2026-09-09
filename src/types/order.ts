export type PaymentMethod = "pix" | "card";

export type PaymentStatus = "pending_payment" | "paid" | "failed";

export type OrderStatus =
  | "draft"
  | "awaiting_delivery_quote"
  | "awaiting_payment"
  | "pending_payment"
  | "paid"
  | "preparing"
  | "ready_for_pickup"
  | "ready_for_delivery"
  | "delivery_requested"
  | "courier_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancellation_pending"
  | "cancelled"
  | "return_in_progress"
  | "returned"
  | "exception";

export type DeliveryStatus =
  | "not_started"
  | "delivery_requested"
  | "driver_assigned"
  | "courier_assigned"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "cancelled"
  | "returned";

export type OrderItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  unitPriceCents?: number;
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
  latitude?: number;
  longitude?: number;
  country?: string;
};

export type StatusHistoryEntry = {
  field: "paymentStatus" | "orderStatus" | "deliveryStatus";
  status: string;
  at: string;
  by: string;
};

export type OrderPaymentBlock = {
  provider?: string;
  externalPaymentId?: string;
  status?: string;
  amountCents?: number;
  currency?: string;
  method?: string;
  createdAt?: string;
  approvedAt?: string;
};

export type OrderDeliveryBlock = {
  provider?: string;
  externalDeliveryId?: string;
  status?: string;
  trackingUrl?: string;
  courier?: {
    name?: string;
    phone?: string;
    vehicle?: string;
    licensePlate?: string;
  };
  lastError?: string;
  pickupEta?: string;
  dropoffEta?: string;
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
  payment?: OrderPaymentBlock;
  delivery?: OrderDeliveryBlock;
  deliveryCreationState?: string;
  createdAt?: string;
  updatedAt?: string;
  statusHistory: StatusHistoryEntry[];
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "paid",
  "preparing",
  "ready_for_pickup",
  "ready_for_delivery",
  "delivery_requested",
  "courier_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

export const DELIVERY_STATUS_BY_ORDER: Partial<
  Record<OrderStatus, DeliveryStatus>
> = {
  paid: "not_started",
  preparing: "not_started",
  ready_for_pickup: "not_started",
  ready_for_delivery: "delivery_requested",
  delivery_requested: "delivery_requested",
  courier_assigned: "courier_assigned",
  picked_up: "picked_up",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};
