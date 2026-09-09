export type PaymentProviderId = "mock" | "mercadopago" | "asaas";
export type DeliveryProviderId = "mock" | "uber_direct";

export type PaymentStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "refunded";

/** Compatible with existing client labels + expanded machine. */
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

export type DeliveryCreationState =
  | "not_started"
  | "creating"
  | "created"
  | "failed"
  | "uncertain";

export type WebhookEventStatus =
  | "received"
  | "processing"
  | "processed"
  | "failed";

export type DeliveryType = "asap" | "scheduled";

export type NormalizedAddress = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  country: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
};

export type StoreConfig = NormalizedAddress & {
  name: string;
  phone: string;
  preparationMinutes: number;
};

export type OrderPricing = {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  currency: "BRL";
};

export type DeliveryQuote = {
  provider: DeliveryProviderId;
  quoteId: string;
  feeCents: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
  estimatedPickupAt?: string;
  estimatedDropoffAt?: string;
  raw?: unknown;
};

export type PaymentRecord = {
  provider: PaymentProviderId;
  externalPaymentId?: string;
  status: PaymentStatus;
  amountCents: number;
  currency: "BRL";
  method?: "pix" | "card";
  createdAt?: string;
  approvedAt?: string;
  refundedAt?: string;
};

export type CourierInfo = {
  name?: string;
  phone?: string;
  vehicle?: string;
  licensePlate?: string;
};

export type DeliveryRecord = {
  provider: DeliveryProviderId;
  quoteId?: string;
  quoteFeeCents?: number;
  quoteExpiresAt?: string;
  externalDeliveryId?: string;
  status?: string;
  pickupEta?: string;
  dropoffEta?: string;
  courier?: CourierInfo;
  trackingUrl?: string;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  createdAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  lastError?: string;
};

export type AuditEvent = {
  type: string;
  at: string;
  by: string;
  meta?: Record<string, unknown>;
};

export type OrderItemSnapshot = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPriceCents: number;
  message: string;
};

export type RecipientSnapshot = {
  name: string;
  phone: string;
  notes?: string;
};

export type BuyerSnapshot = {
  id: string;
  name: string;
  email: string;
};

export type OrderDocument = {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  buyer: BuyerSnapshot;
  recipient: RecipientSnapshot;
  items: OrderItemSnapshot[];
  deliveryAddress: NormalizedAddress;
  deliveryDate: string;
  deliveryPeriodId: string;
  deliveryPeriodLabel: string;
  deliveryType: DeliveryType;
  requestedDeliveryDate?: string;
  requestedDeliveryWindow?: string;
  deliveryNotes?: string;
  pickupNotes?: string;

  pricing: OrderPricing;
  /** Legacy decimal mirrors for existing UI */
  subtotal: number;
  deliveryFee: number;
  total: number;

  paymentMethod: "pix" | "card";
  paymentStatus: "pending_payment" | "paid" | "failed";
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;

  payment: PaymentRecord;
  deliveryQuote?: DeliveryQuote;
  delivery?: DeliveryRecord;
  deliveryCreationState: DeliveryCreationState;

  statusHistory: Array<{
    field: "paymentStatus" | "orderStatus" | "deliveryStatus";
    status: string;
    at: string;
    by: string;
  }>;
  auditLog: AuditEvent[];

  createdAt?: FirebaseFirestore.Timestamp | string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
};

// Minimal Firebase timestamp typing without importing admin in domain
declare namespace FirebaseFirestore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Timestamp = any;
}
