import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import { UBER_RUNTIME_SECRETS, getDeliveryProviderId } from "../config";
import { isAppError, toPublicError } from "../lib/errors";
import { logger } from "../lib/logger";
import * as OrderService from "../services/OrderService";

function requireAuth(request: CallableRequest) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Faça login para continuar.");
  }
  return {
    uid: request.auth.uid,
    token: request.auth.token as { admin?: unknown },
  };
}

function mapError(error: unknown): never {
  const publicError = toPublicError(error);
  logger.error("callable.failed", {
    code: publicError.code,
  });
  if (isAppError(error)) {
    const code =
      error.status === 401
        ? "unauthenticated"
        : error.status === 403
          ? "permission-denied"
          : error.status === 404
            ? "not-found"
            : error.status === 409
              ? "failed-precondition"
              : error.status >= 500
                ? "internal"
                : "invalid-argument";
    throw new HttpsError(code, error.publicMessage);
  }
  throw new HttpsError("internal", publicError.message);
}

const uberSecrets =
  getDeliveryProviderId() === "uber_direct"
    ? [...UBER_RUNTIME_SECRETS]
    : [];

const callOpts = {
  secrets: uberSecrets,
};

export const createDeliveryQuote = onCall(callOpts, async (request) => {
  try {
    const { uid } = requireAuth(request);
    const address = request.data?.address;
    return await OrderService.createDeliveryQuote({
      uid,
      address,
      persistToCart: Boolean(request.data?.persistToCart ?? true),
    });
  } catch (error) {
    mapError(error);
  }
});

export const createCheckout = onCall(callOpts, async (request) => {
  try {
    const { uid } = requireAuth(request);
    const data = request.data ?? {};
    return await OrderService.createCheckout({
      uid,
      customerName: String(data.customerName ?? request.auth?.token.name ?? "Cliente"),
      customerEmail: String(
        data.customerEmail ?? request.auth?.token.email ?? "",
      ),
      paymentMethod: data.paymentMethod === "card" ? "card" : "pix",
      recipient: data.recipient,
      address: data.address,
      items: Array.isArray(data.items) ? data.items : [],
      deliveryDate: String(data.deliveryDate ?? ""),
      deliveryPeriodId: String(data.deliveryPeriodId ?? ""),
      deliveryPeriodLabel: String(data.deliveryPeriodLabel ?? ""),
      deliveryType: data.deliveryType === "asap" ? "asap" : "scheduled",
      deliveryNotes: data.deliveryNotes ? String(data.deliveryNotes) : undefined,
      existingQuote: data.existingQuote,
    });
  } catch (error) {
    mapError(error);
  }
});

export const getOrder = onCall(async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.getOrderForUser(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const simulateMockPayment = onCall(async (request) => {
  try {
    const { uid } = requireAuth(request);
    const outcome = String(request.data?.outcome ?? "approved");
    if (
      outcome !== "approved" &&
      outcome !== "failed" &&
      outcome !== "cancelled" &&
      outcome !== "pending"
    ) {
      throw new HttpsError("invalid-argument", "Outcome inválido.");
    }
    return await OrderService.simulateMockPayment({
      uid,
      orderId: String(request.data?.orderId ?? ""),
      outcome,
    });
  } catch (error) {
    mapError(error);
  }
});

export const markOrderPreparing = onCall(async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.markOrderPreparing(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const markOrderReady = onCall(async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.markOrderReady(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const requestDelivery = onCall(callOpts, async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.requestDelivery(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const retryDelivery = onCall(callOpts, async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.retryDelivery(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const reconcileDelivery = onCall(callOpts, async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.reconcileDelivery(
      uid,
      String(request.data?.orderId ?? ""),
      token,
    );
  } catch (error) {
    mapError(error);
  }
});

export const cancelOrder = onCall(callOpts, async (request) => {
  try {
    const { uid, token } = requireAuth(request);
    return await OrderService.cancelOrder(
      uid,
      String(request.data?.orderId ?? ""),
      request.data?.reason ? String(request.data.reason) : undefined,
      token,
    );
  } catch (error) {
    mapError(error);
  }
});
