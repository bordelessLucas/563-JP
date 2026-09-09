import { QUOTE_TTL_MS, getDeliveryProviderId } from "../config";
import { DeliveryQuote, NormalizedAddress, StoreConfig } from "../domain/types";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { getDeliveryProvider } from "../providers/delivery/factory";
import {
  CreateDeliveryInput,
  DeliveryProvider,
  ProviderDelivery,
} from "../providers/delivery/types";
import { geocodingService } from "./GeocodingService";

function isQuoteExpired(quote?: DeliveryQuote | null): boolean {
  if (!quote?.expiresAt) return true;
  return Date.parse(quote.expiresAt) <= Date.now();
}

/**
 * Generic delivery orchestration — Uber HTTP stays in UberDirectProvider.
 */
export class DeliveryService {
  constructor(
    private readonly provider: DeliveryProvider = getDeliveryProvider(),
  ) {}

  isQuoteExpired(quote?: DeliveryQuote | null): boolean {
    return isQuoteExpired(quote);
  }

  quoteTtlMs(): number {
    return QUOTE_TTL_MS;
  }

  async createQuote(input: {
    pickup: StoreConfig;
    dropoff: NormalizedAddress;
  }): Promise<DeliveryQuote> {
    if (getDeliveryProviderId() === "uber_direct") {
      geocodingService.requireCoordinates(input.dropoff);
      if (
        input.pickup.latitude == null ||
        input.pickup.longitude == null
      ) {
        throw new AppError({
          code: "MISSING_COORDINATES",
          message: "Store pickup missing coordinates",
          publicMessage: "Endereço da loja sem coordenadas configuradas.",
          status: 503,
        });
      }
    }
    const quote = await this.provider.createQuote(input);
    logger.info("delivery.quote_created", {
      provider: quote.provider,
      quoteId: quote.quoteId,
      feeCents: quote.feeCents,
    });
    return quote;
  }

  async createDelivery(input: CreateDeliveryInput): Promise<ProviderDelivery> {
    if (getDeliveryProviderId() === "uber_direct") {
      geocodingService.requireCoordinates(input.dropoff);
    }
    try {
      const delivery = await this.provider.createDelivery(input);
      logger.info("delivery.created", {
        provider: delivery.provider,
        deliveryId: delivery.externalDeliveryId,
      });
      return delivery;
    } catch (error) {
      if (isAmbiguousDeliveryError(error)) {
        throw new AppError({
          code: "DELIVERY_CREATION_UNCERTAIN",
          message:
            error instanceof Error
              ? error.message
              : "Ambiguous delivery create result",
          publicMessage:
            "A solicitação de entrega ficou inconclusiva. Reconcilie antes de tentar de novo.",
          status: 502,
          details: { ambiguous: true },
        });
      }
      throw error;
    }
  }

  async getDelivery(deliveryId: string): Promise<ProviderDelivery> {
    return this.provider.getDelivery(deliveryId);
  }

  async findByExternalOrderId(
    externalOrderId: string,
  ): Promise<ProviderDelivery | null> {
    if (!this.provider.findDeliveryByExternalId) return null;
    return this.provider.findDeliveryByExternalId(externalOrderId);
  }

  async cancelDelivery(deliveryId: string, reason?: string): Promise<void> {
    await this.provider.cancelDelivery(deliveryId, reason);
    logger.info("delivery.cancelled", { deliveryId });
  }
}

export function isAmbiguousDeliveryError(error: unknown): boolean {
  if (!(error instanceof AppError)) {
    // Network / abort without clear API response
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("timeout") ||
        msg.includes("network") ||
        msg.includes("fetch failed") ||
        msg.includes("aborted")
      );
    }
    return false;
  }
  return (
    error.code === "uber_network_error" ||
    error.code === "DELIVERY_CREATION_UNCERTAIN" ||
    error.code === "uber_server_error"
  );
}

export const deliveryService = new DeliveryService();
