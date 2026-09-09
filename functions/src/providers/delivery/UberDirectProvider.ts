import { QUOTE_TTL_MS, getUberConfig } from "../../config";
import { DeliveryQuote, NormalizedAddress, StoreConfig } from "../../domain/types";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { uberDirectAuthService } from "./UberDirectAuthService";
import {
  CreateDeliveryInput,
  DeliveryProvider,
  DeliveryQuoteInput,
  ProviderDelivery,
} from "./types";

function encodeUberAddress(address: NormalizedAddress | StoreConfig): string {
  const streetLine = `${address.street}, ${address.number}`.trim();
  const complement = address.complement?.trim() || "";
  return JSON.stringify({
    street_address: complement ? [streetLine, complement] : [streetLine],
    city: address.city,
    state: address.state,
    zip_code: address.cep.replace(/\D/g, ""),
    country: address.country || "BR",
  });
}

function mapFeeToCents(fee: unknown): number {
  if (typeof fee === "number" && Number.isFinite(fee)) {
    // Uber Direct fee is typically in the smallest currency unit already for some markets;
    // docs examples use integer cents-like values (e.g. 1000). If value looks like reais (< 1000 and has decimals), convert.
    if (!Number.isInteger(fee)) {
      return Math.round(fee * 100);
    }
    return fee;
  }
  if (fee && typeof fee === "object" && "amount" in (fee as object)) {
    return mapFeeToCents((fee as { amount: unknown }).amount);
  }
  return 0;
}

export class UberDirectProvider implements DeliveryProvider {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retried = false,
  ): Promise<T> {
    const config = getUberConfig();
    if (!config.customerId) {
      throw new AppError({
        code: "uber_customer_missing",
        message: "UBER_DIRECT_CUSTOMER_ID missing",
        publicMessage: "Não foi possível solicitar a entrega neste momento.",
        status: 503,
      });
    }

    const token = await uberDirectAuthService.getAccessToken();
    const url = `${config.apiBaseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      logger.error("uber.http.network_error", {
        path,
        message: error instanceof Error ? error.message : "unknown",
      });
      throw new AppError({
        code: "uber_network_error",
        message: "Uber network error",
        publicMessage: "Não foi possível solicitar a entrega neste momento.",
        status: 502,
      });
    }

    if (response.status === 401 && !retried) {
      uberDirectAuthService.invalidate();
      return this.request<T>(method, path, body, true);
    }

    const text = await response.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!response.ok) {
      const code = this.mapHttpError(response.status, json);
      logger.error("uber.http.error", {
        path,
        status: response.status,
        code,
      });
      throw new AppError({
        code,
        message: `Uber API ${response.status}`,
        publicMessage: "Não foi possível solicitar a entrega neste momento.",
        status: response.status >= 500 ? 502 : 400,
        details: { status: response.status },
      });
    }

    return json as T;
  }

  private mapHttpError(status: number, body: unknown): string {
    const message = JSON.stringify(body).toLowerCase();
    if (status === 401) return "uber_unauthorized";
    if (status === 403 || message.includes("customer_blocked")) {
      return "uber_customer_blocked";
    }
    if (status === 404) return "uber_not_found";
    if (status === 409) return "uber_conflict";
    if (status === 429) return "uber_rate_limited";
    if (status >= 500) return "uber_server_error";
    if (message.includes("quote")) return "uber_quote_invalid";
    return "uber_request_failed";
  }

  async createQuote(input: DeliveryQuoteInput): Promise<DeliveryQuote> {
    const config = getUberConfig();
    const payload: Record<string, unknown> = {
      pickup_address: encodeUberAddress(input.pickup),
      dropoff_address: encodeUberAddress(input.dropoff),
    };
    if (input.pickup.latitude != null && input.pickup.longitude != null) {
      payload.pickup_latitude = input.pickup.latitude;
      payload.pickup_longitude = input.pickup.longitude;
    }
    if (input.dropoff.latitude != null && input.dropoff.longitude != null) {
      payload.dropoff_latitude = input.dropoff.latitude;
      payload.dropoff_longitude = input.dropoff.longitude;
    }

    const json = await this.request<{
      id?: string;
      fee?: number;
      currency?: string;
      expires?: string;
      dropoff_eta?: string;
      pickup_duration?: number;
    }>(
      "POST",
      `/v1/customers/${config.customerId}/delivery_quotes`,
      payload,
    );

    if (!json.id) {
      throw new AppError({
        code: "uber_quote_invalid",
        message: "Quote response missing id",
        publicMessage: "Não foi possível calcular o frete.",
        status: 502,
      });
    }

    const createdAt = new Date();
    const expiresAt = json.expires
      ? new Date(json.expires)
      : new Date(createdAt.getTime() + QUOTE_TTL_MS);

    logger.info("uber.quote.created", { quoteId: json.id });

    return {
      provider: "uber_direct",
      quoteId: json.id,
      feeCents: mapFeeToCents(json.fee),
      currency: (json.currency || "BRL").toUpperCase(),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      estimatedDropoffAt: json.dropoff_eta,
      raw: undefined,
    };
  }

  async createDelivery(input: CreateDeliveryInput): Promise<ProviderDelivery> {
    const config = getUberConfig();
    const payload: Record<string, unknown> = {
      quote_id: input.quoteId,
      pickup_name: input.pickup.name,
      pickup_business_name: input.pickup.name,
      pickup_phone_number: input.pickup.phone,
      pickup_address: encodeUberAddress(input.pickup),
      dropoff_name: input.recipientName,
      dropoff_phone_number: input.recipientPhone,
      dropoff_address: encodeUberAddress(input.dropoff),
      manifest_items: input.manifestItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        size: item.size ?? "small",
        price: item.priceCents ?? 0,
      })),
    };

    if (input.pickup.latitude != null && input.pickup.longitude != null) {
      payload.pickup_latitude = input.pickup.latitude;
      payload.pickup_longitude = input.pickup.longitude;
    }
    if (input.dropoff.latitude != null && input.dropoff.longitude != null) {
      payload.dropoff_latitude = input.dropoff.latitude;
      payload.dropoff_longitude = input.dropoff.longitude;
    }
    if (input.pickupNotes) payload.pickup_notes = input.pickupNotes;
    if (input.dropoffNotes) payload.dropoff_notes = input.dropoffNotes;
    if (input.externalOrderId) payload.external_id = input.externalOrderId;
    // Official Uber Direct field — prevents duplicate creates on retry/timeout.
    const idempotencyKey = input.idempotencyKey ?? input.externalOrderId;
    if (idempotencyKey) payload.idempotency_key = idempotencyKey;
    if (input.deliverableAction) {
      payload.deliverable_action = input.deliverableAction;
    }
    if (input.undeliverableAction) {
      payload.undeliverable_action = input.undeliverableAction;
    }

    const json = await this.request<{
      id?: string;
      status?: string;
      tracking_url?: string;
      fee?: number;
      quote_id?: string;
      external_id?: string;
      pickup_eta?: string;
      dropoff_eta?: string;
      courier?: {
        name?: string;
        phone_number?: string;
        vehicle_type?: string;
        vehicle_make?: string;
        vehicle_model?: string;
        license_plate_number?: string;
      };
    }>("POST", `/v1/customers/${config.customerId}/deliveries`, payload);

    if (!json.id) {
      throw new AppError({
        code: "uber_delivery_invalid",
        message: "Delivery response missing id",
        publicMessage: "Não foi possível solicitar a entrega neste momento.",
        status: 502,
      });
    }

    logger.info("uber.delivery.created", {
      deliveryId: json.id,
      orderExternalId: input.externalOrderId,
    });

    return this.mapDelivery(json);
  }

  async getDelivery(deliveryId: string): Promise<ProviderDelivery> {
    const config = getUberConfig();
    const json = await this.request<{
      id?: string;
      status?: string;
      tracking_url?: string;
      fee?: number;
      quote_id?: string;
      external_id?: string;
      pickup_eta?: string;
      dropoff_eta?: string;
      courier?: {
        name?: string;
        phone_number?: string;
        vehicle_type?: string;
        license_plate_number?: string;
      };
    }>("GET", `/v1/customers/${config.customerId}/deliveries/${deliveryId}`);

    return this.mapDelivery(json);
  }

  /**
   * Best-effort: list recent deliveries and match external_id.
   * Used after ambiguous create when we never persisted Uber's delivery id.
   */
  async findDeliveryByExternalId(
    externalOrderId: string,
  ): Promise<ProviderDelivery | null> {
    const config = getUberConfig();
    const json = await this.request<{
      data?: Array<{
        id?: string;
        status?: string;
        tracking_url?: string;
        fee?: number;
        quote_id?: string;
        external_id?: string;
        pickup_eta?: string;
        dropoff_eta?: string;
        courier?: {
          name?: string;
          phone_number?: string;
          vehicle_type?: string;
          license_plate_number?: string;
        };
      }>;
    }>(
      "GET",
      `/v1/customers/${config.customerId}/deliveries?limit=50`,
    );

    const match = (json.data ?? []).find(
      (item) => String(item.external_id ?? "") === externalOrderId,
    );
    return match ? this.mapDelivery(match) : null;
  }

  async cancelDelivery(deliveryId: string, reason?: string): Promise<void> {
    const config = getUberConfig();
    await this.request(
      "POST",
      `/v1/customers/${config.customerId}/deliveries/${deliveryId}/cancel`,
      reason ? { reason } : {},
    );
    logger.info("uber.delivery.cancelled", { deliveryId });
  }

  private mapDelivery(json: {
    id?: string;
    status?: string;
    tracking_url?: string;
    fee?: number;
    quote_id?: string;
    external_id?: string;
    pickup_eta?: string;
    dropoff_eta?: string;
    courier?: {
      name?: string;
      phone_number?: string;
      vehicle_type?: string;
      license_plate_number?: string;
    };
  }): ProviderDelivery {
    return {
      provider: "uber_direct",
      externalDeliveryId: String(json.id ?? ""),
      status: String(json.status ?? "pending"),
      trackingUrl: json.tracking_url,
      feeCents: json.fee != null ? mapFeeToCents(json.fee) : undefined,
      quoteId: json.quote_id,
      externalId: json.external_id,
      pickupEta: json.pickup_eta,
      dropoffEta: json.dropoff_eta,
      courier: json.courier
        ? {
            name: json.courier.name,
            phone: json.courier.phone_number,
            vehicle: json.courier.vehicle_type,
            licensePlate: json.courier.license_plate_number,
          }
        : undefined,
    };
  }
}
