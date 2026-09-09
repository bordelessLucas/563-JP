import { onRequest } from "firebase-functions/v2/https";

import {
  UBER_RUNTIME_SECRETS,
  getDeliveryProviderId,
} from "../config";
import { isAppError, toPublicError } from "../lib/errors";
import { logger } from "../lib/logger";
import { processUberWebhook } from "../services/WebhookService";

/**
 * Uber Direct webhook endpoint.
 * IMPORTANT: uses rawBody for HMAC verification.
 */
export const uberDirectWebhook = onRequest(
  {
    cors: false,
    invoker: "public",
    secrets:
      getDeliveryProviderId() === "uber_direct"
        ? [...UBER_RUNTIME_SECRETS]
        : [],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const rawBody: Buffer = Buffer.isBuffer(req.rawBody)
        ? req.rawBody
        : Buffer.from(
            typeof req.body === "string"
              ? req.body
              : JSON.stringify(req.body ?? {}),
            "utf8",
          );

      const signature =
        (req.header("x-uber-signature") ||
          req.header("x-postmates-signature") ||
          undefined) ?? undefined;

      const result = await processUberWebhook({
        rawBody,
        signature,
      });

      res.status(200).json(result);
    } catch (error) {
      const publicError = toPublicError(error);
      logger.error("uber.webhook.handler_failed", {
        code: publicError.code,
      });
      const status = isAppError(error) ? error.status : 500;
      res.status(status).json({
        error: publicError.message,
        code: publicError.code,
      });
    }
  },
);
