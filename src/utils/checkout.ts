import { Cart, CheckoutDraft } from "@/src/types/checkout";

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidRecipientPhone(phone: string): boolean {
  const digits = phoneDigits(phone);
  return digits.length >= 10 && digits.length <= 11;
}

export function formatPhoneMask(value: string): string {
  const digits = phoneDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function hasRecipient(checkout: CheckoutDraft | null | undefined): boolean {
  const recipient = checkout?.recipient;
  if (!recipient) return false;
  return (
    recipient.name.trim().length > 1 && isValidRecipientPhone(recipient.phone)
  );
}

export function hasAddress(checkout: CheckoutDraft | null | undefined): boolean {
  const address = checkout?.address;
  if (!address) return false;
  return (
    address.street.trim().length > 2 &&
    address.number.trim().length > 0 &&
    address.city.trim().length > 1
  );
}

export function hasSchedule(checkout: CheckoutDraft | null | undefined): boolean {
  return Boolean(
    checkout?.deliveryDate?.trim() &&
      checkout.deliveryPeriodId?.trim() &&
      checkout.deliveryPeriodLabel?.trim(),
  );
}

export function isCheckoutComplete(
  checkout: CheckoutDraft | null | undefined,
): boolean {
  return hasRecipient(checkout) && hasAddress(checkout) && hasSchedule(checkout);
}

export function isCartReadyForPayment(cart: Cart | null | undefined): boolean {
  return Boolean(cart && cart.items.length > 0 && isCheckoutComplete(cart.checkout));
}

/** First incomplete step path for redirects. */
export function checkoutRecoveryHref(
  checkout: CheckoutDraft | null | undefined,
): "/checkout/recipient" | "/checkout/address" | "/checkout/schedule" {
  if (!hasRecipient(checkout)) return "/checkout/recipient";
  if (!hasAddress(checkout)) return "/checkout/address";
  return "/checkout/schedule";
}
