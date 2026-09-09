import * as admin from "firebase-admin";

import { validateRuntimeConfig } from "./config";
import { logger } from "./lib/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

try {
  // Fail closed on dangerous / incomplete production configuration.
  validateRuntimeConfig({
    skipUberSecretCheck: process.env.VITEST === "true",
  });
} catch (error) {
  logger.error("runtime.config.invalid", {
    code: error instanceof Error ? (error as { code?: string }).code : "unknown",
    message: error instanceof Error ? error.message : "unknown",
  });
  // Re-throw so cold start fails loudly in production misconfig.
  throw error;
}

export {
  cancelOrder,
  createCheckout,
  createDeliveryQuote,
  getOrder,
  markOrderPreparing,
  markOrderReady,
  reconcileDelivery,
  requestDelivery,
  retryDelivery,
  simulateMockPayment,
} from "./http/callables";

export { uberDirectWebhook } from "./http/uberWebhook";
export { syncAdminClaims } from "./http/syncAdminClaims";
