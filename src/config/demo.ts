/**
 * Checkout mode for the Expo client.
 *
 * - `client` (default): Firestore-side demo — create orders + advance status
 *   without Cloud Functions. Use while Blaze/Functions are unavailable so the
 *   APK prototype remains testable end-to-end.
 * - `backend`: callables (createDeliveryQuote, createCheckout, simulateMockPayment, …).
 *
 * Set EXPO_PUBLIC_CHECKOUT_MODE=backend in EAS when Functions are deployed.
 */
export type CheckoutMode = "client" | "backend";

export function getCheckoutMode(): CheckoutMode {
  const raw = (process.env.EXPO_PUBLIC_CHECKOUT_MODE ?? "client")
    .trim()
    .toLowerCase();
  return raw === "backend" ? "backend" : "client";
}

export function isClientDemoCheckout(): boolean {
  return getCheckoutMode() === "client";
}
