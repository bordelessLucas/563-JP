import { randomUUID } from "crypto";

import { QUOTE_TTL_MS } from "../../config";
import { DeliveryQuote } from "../../domain/types";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import {
  CreateDeliveryInput,
  DeliveryProvider,
  DeliveryQuoteInput,
  ProviderDelivery,
} from "./types";

type MockDeliveryState = ProviderDelivery & {
  cancelled?: boolean;
};

/**
 * Local/CI delivery provider so checkout works without Uber credentials.
 * Never use in production when real logistics are required.
 */
export class MockDeliveryProvider implements DeliveryProvider {
  private readonly deliveries = new Map<string, MockDeliveryState>();
  private readonly quotes = new Map<string, DeliveryQuote>();
  private readonly byExternalOrderId = new Map<string, string>();

  async createQuote(input: DeliveryQuoteInput): Promise<DeliveryQuote> {
    const createdAt = new Date();
    const quote: DeliveryQuote = {
      provider: "mock",
      quoteId: `mock_q_${randomUUID()}`,
      feeCents: 1990,
      currency: "BRL",
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + QUOTE_TTL_MS).toISOString(),
      estimatedDropoffAt: new Date(
        createdAt.getTime() + 60 * 60 * 1000,
      ).toISOString(),
    };
    this.quotes.set(quote.quoteId, quote);
    logger.info("mock.delivery.quote_created", {
      quoteId: quote.quoteId,
      city: input.dropoff.city,
    });
    return quote;
  }

  async createDelivery(input: CreateDeliveryInput): Promise<ProviderDelivery> {
    const quote = this.quotes.get(input.quoteId);
    if (!quote) {
      throw new AppError({
        code: "uber_quote_invalid",
        message: "Mock quote not found",
        publicMessage: "A cotação de frete expirou. Atualize o valor.",
        status: 400,
      });
    }
    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      throw new AppError({
        code: "quote_expired",
        message: "Mock quote expired",
        publicMessage: "A cotação de frete expirou. Atualize o valor.",
        status: 409,
      });
    }

    const idempotencyKey = input.idempotencyKey ?? input.externalOrderId;
    if (idempotencyKey && this.byExternalOrderId.has(idempotencyKey)) {
      const existingId = this.byExternalOrderId.get(idempotencyKey)!;
      const existing = this.deliveries.get(existingId);
      if (existing) return existing;
    }

    const delivery: MockDeliveryState = {
      provider: "mock",
      externalDeliveryId: `mock_d_${randomUUID()}`,
      status: "pending",
      trackingUrl: `https://example.local/track/${input.externalOrderId ?? "order"}`,
      feeCents: quote.feeCents,
      quoteId: quote.quoteId,
      externalId: input.externalOrderId,
      pickupEta: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      dropoffEta: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      courier: {
        name: "Entregador Demo",
        phone: "+5551988887777",
        vehicle: "bike",
      },
    };
    this.deliveries.set(delivery.externalDeliveryId, delivery);
    if (idempotencyKey) {
      this.byExternalOrderId.set(idempotencyKey, delivery.externalDeliveryId);
    }
    logger.info("mock.delivery.created", {
      deliveryId: delivery.externalDeliveryId,
    });
    return delivery;
  }

  async getDelivery(deliveryId: string): Promise<ProviderDelivery> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      throw new AppError({
        code: "uber_not_found",
        message: "Mock delivery not found",
        publicMessage: "Entrega não encontrada.",
        status: 404,
      });
    }
    return delivery;
  }

  async findDeliveryByExternalId(
    externalOrderId: string,
  ): Promise<ProviderDelivery | null> {
    const id = this.byExternalOrderId.get(externalOrderId);
    if (!id) return null;
    return this.deliveries.get(id) ?? null;
  }

  async cancelDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      throw new AppError({
        code: "uber_not_found",
        message: "Mock delivery not found",
        publicMessage: "Entrega não encontrada.",
        status: 404,
      });
    }
    delivery.status = "canceled";
    delivery.cancelled = true;
    this.deliveries.set(deliveryId, delivery);
  }
}
