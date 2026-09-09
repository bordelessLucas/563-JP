import { defineSecret, defineString } from "firebase-functions/params";

import { DeliveryProviderId, PaymentProviderId, StoreConfig } from "./domain/types";
import { AppError } from "./lib/errors";

/** Non-sensitive runtime params (safe to set as plain env / params). */
export const paramAppEnv = defineString("APP_ENV", { default: "" });
export const paramPaymentProvider = defineString("PAYMENT_PROVIDER", {
  default: "mock",
});
export const paramDeliveryProvider = defineString("DELIVERY_PROVIDER", {
  default: "mock",
});
export const paramEnableMockPayment = defineString("ENABLE_MOCK_PAYMENT", {
  default: "false",
});
export const paramUberMode = defineString("UBER_DIRECT_MODE", { default: "test" });
export const paramUberClientId = defineString("UBER_DIRECT_CLIENT_ID", {
  default: "",
});
export const paramUberCustomerId = defineString("UBER_DIRECT_CUSTOMER_ID", {
  default: "",
});

/**
 * Sensitive secrets — set via:
 *   firebase functions:secrets:set UBER_DIRECT_CLIENT_SECRET
 *   firebase functions:secrets:set UBER_DIRECT_WEBHOOK_SIGNING_KEY
 * Never put real values in .env.example or EXPO_PUBLIC_*.
 */
export const secretUberClientSecret = defineSecret("UBER_DIRECT_CLIENT_SECRET");
export const secretUberWebhookSigningKey = defineSecret(
  "UBER_DIRECT_WEBHOOK_SIGNING_KEY",
);

/** Secrets that must be bound on callables/HTTP that talk to Uber. */
export const UBER_RUNTIME_SECRETS = [
  secretUberClientSecret,
  secretUberWebhookSigningKey,
] as const;

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function envNumber(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function envFlagTrue(name: string): boolean {
  return env(name).toLowerCase() === "true";
}

/**
 * Production detection — fail-closed for dangerous features.
 * Explicit non-prod labels are required to disable production mode.
 */
export function isProduction(): boolean {
  const appEnv = env("APP_ENV").toLowerCase();
  if (appEnv === "production") return true;
  if (
    appEnv === "development" ||
    appEnv === "dev" ||
    appEnv === "test" ||
    appEnv === "staging"
  ) {
    return false;
  }
  // Emulator / vitest are never treated as production.
  if (env("FUNCTIONS_EMULATOR") === "true") return false;
  if (env("NODE_ENV").toLowerCase() === "test") return false;
  if (env("VITEST") === "true") return false;
  // Unset or unknown APP_ENV → treat as production (fail closed).
  return true;
}

export function getAppEnv(): string {
  const appEnv = env("APP_ENV").toLowerCase();
  if (appEnv) return appEnv;
  return isProduction() ? "production" : "development";
}

export function getPaymentProviderId(): PaymentProviderId {
  const value = env("PAYMENT_PROVIDER", "mock").toLowerCase();
  if (value === "mercadopago" || value === "asaas" || value === "mock") {
    return value;
  }
  return "mock";
}

export function getDeliveryProviderId(): DeliveryProviderId {
  const value = env("DELIVERY_PROVIDER", "mock").toLowerCase();
  if (value === "uber_direct" || value === "mock") {
    return value;
  }
  return "mock";
}

/**
 * Mock payment simulation is fail-closed.
 * Requires ALL of: PAYMENT_PROVIDER=mock, ENABLE_MOCK_PAYMENT=true, not production.
 */
export function canSimulateMockPayment(): boolean {
  if (isProduction()) return false;
  if (getPaymentProviderId() !== "mock") return false;
  if (!envFlagTrue("ENABLE_MOCK_PAYMENT")) return false;
  return true;
}

export function getUberConfig() {
  return {
    mode: env("UBER_DIRECT_MODE", "test").toLowerCase() || "test",
    clientId: env("UBER_DIRECT_CLIENT_ID"),
    // Prefer process.env (local/tests); Secret Manager when bound on the function.
    clientSecret:
      env("UBER_DIRECT_CLIENT_SECRET") ||
      trySecretValue(secretUberClientSecret),
    customerId: env("UBER_DIRECT_CUSTOMER_ID"),
    webhookSigningKey:
      env("UBER_DIRECT_WEBHOOK_SIGNING_KEY") ||
      trySecretValue(secretUberWebhookSigningKey),
    authUrl: "https://auth.uber.com/oauth/v2/token",
    apiBaseUrl: "https://api.uber.com",
  };
}

export function getStoreConfigFromEnv(): StoreConfig {
  return {
    name: env("STORE_NAME", "JP Flores"),
    phone: env("STORE_PHONE", "+5551999999999"),
    street: env("STORE_STREET", "Rua Exemplo"),
    number: env("STORE_NUMBER", "100"),
    complement: env("STORE_COMPLEMENT") || undefined,
    neighborhood: env("STORE_NEIGHBORHOOD", "Centro"),
    city: env("STORE_CITY", "Porto Alegre"),
    state: env("STORE_STATE", "RS"),
    cep: env("STORE_CEP", "90000000"),
    country: env("STORE_COUNTRY", "BR"),
    latitude: envNumber("STORE_LATITUDE", -30.0346),
    longitude: envNumber("STORE_LONGITUDE", -51.2177),
    preparationMinutes: envNumber("STORE_PREPARATION_MINUTES", 60),
  };
}

export const QUOTE_TTL_MS = 15 * 60 * 1000;
export const WEBHOOK_PROCESSING_LEASE_MS = 2 * 60 * 1000;

/**
 * Fail early on invalid / dangerous runtime configuration.
 * Call from Cloud Functions entry (index) and in tests.
 */
export function validateRuntimeConfig(options?: {
  /** When true, skip Uber secret checks (unit tests without secrets). */
  skipUberSecretCheck?: boolean;
}): void {
  const payment = getPaymentProviderId();
  const delivery = getDeliveryProviderId();
  const prod = isProduction();

  if (prod && payment === "mock") {
    throw new AppError({
      code: "INVALID_RUNTIME_CONFIGURATION",
      message: "PAYMENT_PROVIDER=mock is forbidden in production",
      publicMessage: "Configuração de pagamento inválida.",
      status: 503,
    });
  }

  if (prod && envFlagTrue("ENABLE_MOCK_PAYMENT")) {
    throw new AppError({
      code: "INVALID_RUNTIME_CONFIGURATION",
      message: "ENABLE_MOCK_PAYMENT=true is forbidden in production",
      publicMessage: "Configuração de pagamento inválida.",
      status: 503,
    });
  }

  if (payment === "mercadopago" || payment === "asaas") {
    throw new AppError({
      code: "PAYMENT_PROVIDER_NOT_IMPLEMENTED",
      message: `PAYMENT_PROVIDER=${payment} is a placeholder and cannot run`,
      publicMessage: "Gateway de pagamento ainda não configurado.",
      status: 501,
    });
  }

  if (delivery === "uber_direct" && !options?.skipUberSecretCheck) {
    const uber = getUberConfig();
    const missing: string[] = [];
    if (!uber.clientId) missing.push("UBER_DIRECT_CLIENT_ID");
    if (!uber.clientSecret) missing.push("UBER_DIRECT_CLIENT_SECRET");
    if (!uber.customerId) missing.push("UBER_DIRECT_CUSTOMER_ID");
    if (!uber.webhookSigningKey) missing.push("UBER_DIRECT_WEBHOOK_SIGNING_KEY");
    if (missing.length) {
      throw new AppError({
        code: "INVALID_RUNTIME_CONFIGURATION",
        message: `Uber Direct missing: ${missing.join(", ")}`,
        publicMessage: "Entrega indisponível: configuração incompleta.",
        status: 503,
      });
    }
    if (prod && uber.mode !== "test" && uber.mode !== "production") {
      throw new AppError({
        code: "INVALID_RUNTIME_CONFIGURATION",
        message: `Invalid UBER_DIRECT_MODE=${uber.mode}`,
        publicMessage: "Modo Uber inválido.",
        status: 503,
      });
    }
  }
}

/** Safe accessor for secrets when not bound (local/tests). */
export function trySecretValue(secret: { value: () => string }): string {
  if (env("VITEST") === "true" || env("FUNCTIONS_EMULATOR") === "true") {
    return "";
  }
  try {
    return secret.value() || "";
  } catch {
    return "";
  }
}
