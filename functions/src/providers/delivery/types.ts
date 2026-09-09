import { DeliveryQuote, NormalizedAddress, StoreConfig } from "../../domain/types";

export type DeliveryQuoteInput = {
  pickup: StoreConfig;
  dropoff: NormalizedAddress;
  externalOrderId?: string;
};

export type ManifestItem = {
  name: string;
  quantity: number;
  size?: "small" | "medium" | "large" | "xlarge";
  priceCents?: number;
};

export type CreateDeliveryInput = {
  quoteId: string;
  pickup: StoreConfig;
  dropoff: NormalizedAddress;
  recipientName: string;
  recipientPhone: string;
  pickupNotes?: string;
  dropoffNotes?: string;
  manifestItems: ManifestItem[];
  externalOrderId?: string;
  /** Uber Direct idempotency_key — use orderId to prevent duplicate creates. */
  idempotencyKey?: string;
  deliverableAction?: string;
  undeliverableAction?: string;
};

export type ProviderDelivery = {
  provider: "uber_direct" | "mock";
  externalDeliveryId: string;
  status: string;
  trackingUrl?: string;
  feeCents?: number;
  quoteId?: string;
  externalId?: string;
  pickupEta?: string;
  dropoffEta?: string;
  courier?: {
    name?: string;
    phone?: string;
    vehicle?: string;
    licensePlate?: string;
  };
  raw?: unknown;
};

export interface DeliveryProvider {
  createQuote(input: DeliveryQuoteInput): Promise<DeliveryQuote>;
  createDelivery(input: CreateDeliveryInput): Promise<ProviderDelivery>;
  getDelivery(deliveryId: string): Promise<ProviderDelivery>;
  cancelDelivery(deliveryId: string, reason?: string): Promise<void>;
  /** Best-effort lookup after ambiguous create (optional). */
  findDeliveryByExternalId?(
    externalOrderId: string,
  ): Promise<ProviderDelivery | null>;
}
