import { createHmac, timingSafeEqual } from "crypto";

import * as admin from "firebase-admin";

import {
  WEBHOOK_PROCESSING_LEASE_MS,
  getUberConfig,
} from "../config";
import { shouldApplyOrderStatus } from "../domain/orderStateMachine";
import { WebhookEventStatus } from "../domain/types";
import { mapUberDeliveryStatus, mapUberOrderStatus } from "../domain/uberStatusMapper";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export type WebhookProcessResult = {
  ok: true;
  duplicate?: boolean;
  inProgress?: boolean;
  reprocessed?: boolean;
};

export function verifyUberWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
): boolean {
  const { webhookSigningKey } = getUberConfig();
  if (!webhookSigningKey) {
    throw new AppError({
      code: "INVALID_RUNTIME_CONFIGURATION",
      message: "UBER_DIRECT_WEBHOOK_SIGNING_KEY missing",
      publicMessage: "Webhook não configurado.",
      status: 503,
    });
  }
  if (!signatureHeader) return false;

  const payload =
    typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const digest = createHmac("sha256", webhookSigningKey)
    .update(payload)
    .digest("hex");

  const left = Buffer.from(digest, "utf8");
  const right = Buffer.from(signatureHeader.trim(), "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function eventFingerprint(payload: Record<string, unknown>): string {
  const kind = String(payload.kind ?? payload.event_type ?? "unknown");
  const deliveryId = String(
    payload.delivery_id ??
      (payload.data as { id?: string } | undefined)?.id ??
      payload.id ??
      "",
  );
  const status = String(
    (payload.data as { status?: string } | undefined)?.status ??
      payload.status ??
      "",
  );
  const created = String(payload.created ?? payload.event_time ?? "");
  return `${kind}:${deliveryId}:${status}:${created}`;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "unknown";
  return raw.slice(0, 200);
}

type ClaimOutcome =
  | { action: "process"; attempts: number; reprocessed: boolean }
  | { action: "skip_processed" }
  | { action: "skip_in_flight" };

async function claimWebhookEvent(input: {
  eventId: string;
  kind: string;
}): Promise<ClaimOutcome> {
  const eventRef = db.doc(`webhookEvents/${input.eventId}`);
  const nowMs = Date.now();

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(eventRef);
    if (!existing.exists) {
      tx.set(eventRef, {
        provider: "uber_direct",
        eventType: input.kind,
        status: "processing" satisfies WebhookEventStatus,
        attempts: 1,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        fingerprint: input.eventId,
      });
      return { action: "process" as const, attempts: 1, reprocessed: false };
    }

    const data = existing.data() as {
      status?: WebhookEventStatus;
      attempts?: number;
      processingStartedAt?: { toMillis?: () => number } | string;
    };
    const status = data.status ?? "processed";
    const attempts = Number(data.attempts ?? 1);

    if (status === "processed") {
      return { action: "skip_processed" as const };
    }

    if (status === "processing") {
      let startedMs = 0;
      const started = data.processingStartedAt;
      if (started && typeof started === "object" && "toMillis" in started) {
        startedMs = started.toMillis?.() ?? 0;
      } else if (typeof started === "string") {
        startedMs = Date.parse(started) || 0;
      }
      const leaseValid =
        startedMs > 0 && nowMs - startedMs < WEBHOOK_PROCESSING_LEASE_MS;
      if (leaseValid) {
        return { action: "skip_in_flight" as const };
      }
      // Stale lease — reclaim
      tx.update(eventRef, {
        status: "processing",
        attempts: attempts + 1,
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastError: admin.firestore.FieldValue.delete(),
      });
      return {
        action: "process" as const,
        attempts: attempts + 1,
        reprocessed: true,
      };
    }

    if (status === "failed" || status === "received") {
      tx.update(eventRef, {
        status: "processing",
        attempts: attempts + 1,
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastError: admin.firestore.FieldValue.delete(),
      });
      return {
        action: "process" as const,
        attempts: attempts + 1,
        reprocessed: true,
      };
    }

    return { action: "skip_processed" as const };
  });
}

export async function processUberWebhook(input: {
  rawBody: Buffer;
  signature?: string;
}): Promise<WebhookProcessResult> {
  const valid = verifyUberWebhookSignature(input.rawBody, input.signature);
  if (!valid) {
    logger.warn("uber.webhook.invalid_signature", {});
    throw new AppError({
      code: "INVALID_WEBHOOK_SIGNATURE",
      message: "Invalid Uber webhook signature",
      publicMessage: "Assinatura inválida.",
      status: 401,
    });
  }

  const payload = JSON.parse(input.rawBody.toString("utf8")) as Record<
    string,
    unknown
  >;
  const kind = String(payload.kind ?? payload.event_type ?? "");
  const eventId =
    String(payload.id ?? payload.event_id ?? "") || eventFingerprint(payload);

  const claim = await claimWebhookEvent({ eventId, kind });
  if (claim.action === "skip_processed") {
    logger.info("uber.webhook.duplicate", { eventId, kind });
    return { ok: true, duplicate: true };
  }
  if (claim.action === "skip_in_flight") {
    logger.info("uber.webhook.in_flight", { eventId, kind });
    // Non-2xx so Uber can retry after lease expires — event is not processed yet.
    throw new AppError({
      code: "webhook_in_progress",
      message: "Webhook event still processing",
      publicMessage: "Evento em processamento.",
      status: 503,
    });
  }

  const eventRef = db.doc(`webhookEvents/${eventId}`);
  try {
    if (kind.includes("courier_update") || kind === "event.courier_update") {
      await handleCourierUpdate(payload);
    } else if (
      kind.includes("delivery_status") ||
      kind === "event.delivery_status"
    ) {
      await handleDeliveryStatus(payload);
    } else {
      logger.info("uber.webhook.ignored_kind", { kind, eventId });
    }
    await eventRef.update({
      status: "processed" satisfies WebhookEventStatus,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
      ok: true,
      reprocessed: claim.reprocessed,
    };
  } catch (error) {
    await eventRef.update({
      status: "failed" satisfies WebhookEventStatus,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastError: sanitizeErrorMessage(error),
    });
    throw error;
  }
}

async function findOrderByDeliveryId(deliveryId: string) {
  const snap = await db
    .collection("orders")
    .where("delivery.externalDeliveryId", "==", deliveryId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0];
}

async function handleDeliveryStatus(payload: Record<string, unknown>) {
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const deliveryId = String(
    data.id ?? data.delivery_id ?? payload.delivery_id ?? "",
  );
  const status = String(data.status ?? "");
  if (!deliveryId || !status) return;

  const orderDoc = await findOrderByDeliveryId(deliveryId);
  if (!orderDoc) {
    logger.warn("uber.webhook.order_not_found", { deliveryId, status });
    return;
  }

  const mappedDelivery = mapUberDeliveryStatus(status);
  const mappedOrder = mapUberOrderStatus(status);
  const current = orderDoc.data();
  const updates: Record<string, unknown> = {
    "delivery.status": status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (mappedDelivery) {
    updates.deliveryStatus = mappedDelivery;
  }
  if (
    mappedOrder &&
    shouldApplyOrderStatus(current.orderStatus, mappedOrder)
  ) {
    updates.orderStatus = mappedOrder;
    updates.statusHistory = admin.firestore.FieldValue.arrayUnion({
      field: "orderStatus",
      status: mappedOrder,
      at: new Date().toISOString(),
      by: "uber_webhook",
    });
  }

  if (status.toLowerCase() === "delivered") {
    updates["delivery.deliveredAt"] = new Date().toISOString();
  }
  if (status.toLowerCase() === "pickup_complete") {
    updates["delivery.pickedUpAt"] = new Date().toISOString();
  }

  updates.auditLog = admin.firestore.FieldValue.arrayUnion({
    type: "UBER_STATUS",
    at: new Date().toISOString(),
    by: "uber_webhook",
    meta: { deliveryId, status },
  });

  await orderDoc.ref.update(updates);
  logger.info("uber.webhook.status_applied", {
    orderId: orderDoc.id,
    deliveryId,
    status,
  });
}

async function handleCourierUpdate(payload: Record<string, unknown>) {
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const deliveryId = String(
    data.id ?? data.delivery_id ?? payload.delivery_id ?? "",
  );
  const location = (data.location ?? payload.location) as
    | { lat?: number; lng?: number; latitude?: number; longitude?: number }
    | undefined;
  if (!deliveryId || !location) return;

  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const orderDoc = await findOrderByDeliveryId(deliveryId);
  if (!orderDoc) return;

  const previous = orderDoc.data().delivery?.lastKnownLocation?.updatedAt;
  if (previous) {
    const prevMs = Date.parse(String(previous));
    if (Number.isFinite(prevMs) && Date.now() - prevMs < 15_000) {
      return;
    }
  }

  const terminal = ["delivered", "cancelled", "returned"].includes(
    String(orderDoc.data().orderStatus),
  );
  if (terminal) return;

  const courierRaw = data.courier as
    | {
        name?: string;
        phone_number?: string;
        vehicle_type?: string;
        license_plate_number?: string;
      }
    | undefined;

  await orderDoc.ref.update({
    "delivery.lastKnownLocation": {
      latitude: lat,
      longitude: lng,
      updatedAt: new Date().toISOString(),
    },
    // Avoid logging PII; store only if provider sent it.
    "delivery.courier": courierRaw
      ? {
          name: courierRaw.name,
          phone: courierRaw.phone_number,
          vehicle: courierRaw.vehicle_type,
          licensePlate: courierRaw.license_plate_number,
        }
      : (orderDoc.data().delivery?.courier ?? null),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
