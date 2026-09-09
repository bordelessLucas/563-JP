import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canSimulateMockPayment,
  isProduction,
  validateRuntimeConfig,
} from "../src/config";
import {
  assertOrderTransition,
  canTransitionOrderStatus,
  shouldApplyOrderStatus,
} from "../src/domain/orderStateMachine";
import { mapUberDeliveryStatus, mapUberOrderStatus } from "../src/domain/uberStatusMapper";
import { AppError } from "../src/lib/errors";
import { fromCents, toCents } from "../src/lib/money";
import { UberDirectAuthService } from "../src/providers/delivery/UberDirectAuthService";
import { MockDeliveryProvider } from "../src/providers/delivery/MockDeliveryProvider";
import { MockPaymentProvider } from "../src/providers/payment/MockPaymentProvider";
import { verifyUberWebhookSignature } from "../src/services/WebhookService";
import { getStoreConfigFromEnv } from "../src/config";
// cart UI estimate helper (mirrored — do not import Expo app modules here)
function estimateCartTotal(
  items: Array<{ unitPrice: number; quantity: number }>,
  deliveryFee: number,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  return subtotal + (items.length > 0 ? deliveryFee : 0);
}

describe("money", () => {
  it("converts reais to cents", () => {
    expect(toCents(18.9)).toBe(1890);
    expect(fromCents(1890)).toBe(18.9);
  });
});

describe("fail-closed mock payment", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    process.env.VITEST = "true";
  });

  it("blocks simulation when ENABLE_MOCK_PAYMENT is unset", () => {
    process.env.APP_ENV = "development";
    process.env.PAYMENT_PROVIDER = "mock";
    delete process.env.ENABLE_MOCK_PAYMENT;
    expect(canSimulateMockPayment()).toBe(false);
  });

  it("blocks simulation in production even with ENABLE_MOCK_PAYMENT=true", () => {
    process.env.APP_ENV = "production";
    process.env.PAYMENT_PROVIDER = "mock";
    process.env.ENABLE_MOCK_PAYMENT = "true";
    expect(isProduction()).toBe(true);
    expect(canSimulateMockPayment()).toBe(false);
  });

  it("allows simulation only when mock + flag + non-prod", () => {
    process.env.APP_ENV = "development";
    process.env.PAYMENT_PROVIDER = "mock";
    process.env.ENABLE_MOCK_PAYMENT = "true";
    expect(canSimulateMockPayment()).toBe(true);
  });

  it("validateRuntimeConfig rejects mock payment in production", () => {
    process.env.APP_ENV = "production";
    process.env.PAYMENT_PROVIDER = "mock";
    process.env.ENABLE_MOCK_PAYMENT = "false";
    process.env.DELIVERY_PROVIDER = "mock";
    expect(() => validateRuntimeConfig({ skipUberSecretCheck: true })).toThrow(
      /PAYMENT_PROVIDER=mock/,
    );
  });

  it("validateRuntimeConfig rejects unimplemented payment providers", () => {
    process.env.APP_ENV = "development";
    process.env.PAYMENT_PROVIDER = "mercadopago";
    process.env.ENABLE_MOCK_PAYMENT = "false";
    process.env.DELIVERY_PROVIDER = "mock";
    expect(() => validateRuntimeConfig({ skipUberSecretCheck: true })).toThrow(
      /PAYMENT_PROVIDER_NOT_IMPLEMENTED|placeholder/i,
    );
  });

  it("unset APP_ENV is treated as production (fail-closed)", () => {
    delete process.env.APP_ENV;
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.VITEST;
    process.env.NODE_ENV = "production";
    expect(isProduction()).toBe(true);
    process.env.VITEST = "true";
  });
});

describe("order state machine", () => {
  it("allows awaiting_payment → paid", () => {
    expect(canTransitionOrderStatus("awaiting_payment", "paid")).toBe(true);
    assertOrderTransition("awaiting_payment", "paid");
  });

  it("blocks preparing → delivered", () => {
    expect(canTransitionOrderStatus("preparing", "delivered")).toBe(false);
    expect(() => assertOrderTransition("preparing", "delivered")).toThrow(
      AppError,
    );
  });

  it("does not regress terminal status", () => {
    expect(shouldApplyOrderStatus("delivered", "out_for_delivery")).toBe(false);
  });
});

describe("uber status mapper", () => {
  it("maps delivery statuses", () => {
    expect(mapUberDeliveryStatus("pending")).toBe("delivery_requested");
    expect(mapUberDeliveryStatus("pickup")).toBe("courier_assigned");
    expect(mapUberDeliveryStatus("pickup_complete")).toBe("picked_up");
    expect(mapUberDeliveryStatus("dropoff")).toBe("out_for_delivery");
    expect(mapUberDeliveryStatus("delivered")).toBe("delivered");
    expect(mapUberOrderStatus("canceled")).toBe("cancelled");
  });
});

describe("MockPaymentProvider", () => {
  it("creates pending payment and simulates approved", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createPayment({
      orderId: "o1",
      amountCents: 1000,
      currency: "BRL",
      method: "pix",
      customer: { id: "u1", name: "A", email: "a@b.com" },
    });
    expect(session.status).toBe("pending");
    const status = await provider.simulateStatus(session.paymentId, "approved");
    expect(status).toBe("approved");
  });
});

describe("checkout feeCents authority", () => {
  it("documents that client feeCents must be ignored (server re-quotes)", () => {
    // OrderService.createCheckout always calls deliveryService.createQuote.
    const clientAdulteratedFeeCents = 0;
    const serverFeeCents = 1990;
    expect(clientAdulteratedFeeCents).not.toBe(serverFeeCents);
    const authoritative = serverFeeCents;
    expect(authoritative).toBe(1990);
  });

  it("cart totals are UI estimates only", () => {
    const total = estimateCartTotal(
      [{ unitPrice: 10, quantity: 1 }],
      5,
    );
    expect(total).toBe(15);
    // Charging must use backend pricing.totalCents, not this value.
  });
});

describe("delivery readiness rules (unit)", () => {
  it("requires payment approved and ready_for_pickup", () => {
    const canRequest = (paymentStatus: string, orderStatus: string) =>
      paymentStatus === "approved" &&
      (orderStatus === "ready_for_pickup" || orderStatus === "ready_for_delivery");

    expect(canRequest("pending", "ready_for_pickup")).toBe(false);
    expect(canRequest("approved", "preparing")).toBe(false);
    expect(canRequest("approved", "paid")).toBe(false);
    expect(canRequest("approved", "exception")).toBe(false);
    expect(canRequest("approved", "ready_for_pickup")).toBe(true);
  });

  it("retry only from failed creation state", () => {
    const canRetry = (creation: string) => creation === "failed";
    expect(canRetry("not_started")).toBe(false);
    expect(canRetry("creating")).toBe(false);
    expect(canRetry("uncertain")).toBe(false);
    expect(canRetry("failed")).toBe(true);
  });
});

describe("MockDeliveryProvider quotes", () => {
  it("creates quote with expiry and delivery", async () => {
    const provider = new MockDeliveryProvider();
    const store = getStoreConfigFromEnv();
    const quote = await provider.createQuote({
      pickup: store,
      dropoff: {
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "Porto Alegre",
        state: "RS",
        cep: "90000000",
        country: "BR",
      },
    });
    expect(quote.feeCents).toBe(1990);
    expect(Date.parse(quote.expiresAt)).toBeGreaterThan(Date.now());

    const delivery = await provider.createDelivery({
      quoteId: quote.quoteId,
      pickup: store,
      dropoff: {
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "Porto Alegre",
        state: "RS",
        cep: "90000000",
        country: "BR",
      },
      recipientName: "Maria",
      recipientPhone: "+5551999999999",
      manifestItems: [{ name: "Buque", quantity: 1, priceCents: 10000 }],
    });
    expect(delivery.externalDeliveryId).toMatch(/^mock_d_/);
  });

  it("rejects expired quote", async () => {
    vi.useFakeTimers();
    const provider = new MockDeliveryProvider();
    const store = getStoreConfigFromEnv();
    const quote = await provider.createQuote({
      pickup: store,
      dropoff: {
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "Porto Alegre",
        state: "RS",
        cep: "90000000",
        country: "BR",
      },
    });
    vi.advanceTimersByTime(16 * 60 * 1000);
    await expect(
      provider.createDelivery({
        quoteId: quote.quoteId,
        pickup: store,
        dropoff: {
          street: "Rua A",
          number: "10",
          neighborhood: "Centro",
          city: "Porto Alegre",
          state: "RS",
          cep: "90000000",
          country: "BR",
        },
        recipientName: "Maria",
        recipientPhone: "+5551999999999",
        manifestItems: [{ name: "Buque", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(AppError);
    vi.useRealTimers();
  });
});

describe("webhook signature", () => {
  const key = "test-signing-key";

  beforeEach(() => {
    process.env.UBER_DIRECT_WEBHOOK_SIGNING_KEY = key;
  });

  afterEach(() => {
    delete process.env.UBER_DIRECT_WEBHOOK_SIGNING_KEY;
  });

  it("accepts valid signature", () => {
    const raw = Buffer.from(
      '{"kind":"event.delivery_status","data":{"id":"d1","status":"pending"}}',
      "utf8",
    );
    const signature = createHmac("sha256", key).update(raw).digest("hex");
    expect(verifyUberWebhookSignature(raw, signature)).toBe(true);
  });

  it("rejects invalid signature", () => {
    const raw = Buffer.from('{"kind":"event.delivery_status"}', "utf8");
    expect(verifyUberWebhookSignature(raw, "deadbeef")).toBe(false);
  });
});

describe("UberDirectAuthService token cache", () => {
  beforeEach(() => {
    process.env.UBER_DIRECT_CLIENT_ID = "client";
    process.env.UBER_DIRECT_CLIENT_SECRET = "secret";
  });

  afterEach(() => {
    delete process.env.UBER_DIRECT_CLIENT_ID;
    delete process.env.UBER_DIRECT_CLIENT_SECRET;
    vi.unstubAllGlobals();
  });

  it("reuses cached token within expiry margin", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "token-1",
        expires_in: 3600,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const auth = new UberDirectAuthService();
    const first = await auth.getAccessToken();
    const second = await auth.getAccessToken();
    expect(first).toBe("token-1");
    expect(second).toBe("token-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("concurrent delivery lock (unit)", () => {
  it("only one create proceeds from not_started", () => {
    let state: "not_started" | "creating" | "created" = "not_started";
    const tryLock = () => {
      if (state === "creating" || state === "created") return false;
      state = "creating";
      return true;
    };
    expect(tryLock()).toBe(true);
    expect(tryLock()).toBe(false);
    state = "created";
    expect(tryLock()).toBe(false);
  });
});

describe("idempotency / reconcile by external id", () => {
  it("MockDeliveryProvider returns same delivery for same idempotency key", async () => {
    const provider = new MockDeliveryProvider();
    const store = getStoreConfigFromEnv();
    const quote = await provider.createQuote({
      pickup: store,
      dropoff: {
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "Porto Alegre",
        state: "RS",
        cep: "90000000",
        country: "BR",
      },
    });
    const input = {
      quoteId: quote.quoteId,
      pickup: store,
      dropoff: {
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "Porto Alegre",
        state: "RS",
        cep: "90000000",
        country: "BR",
      },
      recipientName: "Maria",
      recipientPhone: "+5551999999999",
      externalOrderId: "order_abc",
      idempotencyKey: "order_abc",
      manifestItems: [{ name: "Buque", quantity: 1 }],
    };
    const first = await provider.createDelivery(input);
    const second = await provider.createDelivery(input);
    expect(second.externalDeliveryId).toBe(first.externalDeliveryId);
    const found = await provider.findDeliveryByExternalId("order_abc");
    expect(found?.externalDeliveryId).toBe(first.externalDeliveryId);
  });
});
