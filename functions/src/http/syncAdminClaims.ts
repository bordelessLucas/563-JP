import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

import { logger } from "../lib/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Keep Auth custom claims in sync with Firestore users/{uid}.role.
 * Callables and rules prefer request.auth.token.admin; Firestore role remains fallback.
 * After promoting someone to admin, they must refresh the ID token (re-login / getIdToken(true)).
 */
export const syncAdminClaims = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before?.data()?.role;
    const after = event.data?.after?.data()?.role;
    if (before === after) return;
    if (!event.data?.after.exists) {
      try {
        await admin.auth().setCustomUserClaims(uid, { admin: false });
      } catch (error) {
        logger.warn("auth.claims.clear_failed", {
          uid,
          code: error instanceof Error ? error.message : "unknown",
        });
      }
      return;
    }

    const isAdmin = after === "admin";
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
      logger.info("auth.claims.synced", { uid, admin: isAdmin });
    } catch (error) {
      logger.error("auth.claims.sync_failed", {
        uid,
        code: error instanceof Error ? error.message : "unknown",
      });
    }
  },
);
