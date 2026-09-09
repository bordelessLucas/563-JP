import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { getOperationSettings } from "@/src/services/settings.service";
import {
  Cart,
  CartItem,
  CheckoutDraft,
} from "@/src/types/checkout";

const database = getFirestore(firebaseApp);

function emptyCart(userId: string, deliveryFee = 0): Cart {
  return {
    userId,
    items: [],
    subtotal: 0,
    deliveryFee,
    total: deliveryFee,
    checkout: null,
  };
}

export function calculateCartTotals(
  items: CartItem[],
  deliveryFee: number,
): Pick<Cart, "subtotal" | "deliveryFee" | "total"> {
  // UI-only estimates. Authoritative checkout totals come from Cloud Functions
  // (PricingService + DeliveryService quote). Never use these for charging.
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const fee = items.length > 0 ? deliveryFee : 0;
  return {
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
  };
}

function mapCart(userId: string, data: Record<string, unknown>): Cart {
  const items = Array.isArray(data.items) ? (data.items as CartItem[]) : [];
  const deliveryFee = Number(data.deliveryFee ?? 0);
  const totals = calculateCartTotals(items, deliveryFee);

  return {
    userId,
    items,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    checkout: (data.checkout as CheckoutDraft | null) ?? null,
  };
}

async function persistCart(cart: Cart): Promise<Cart> {
  const totals = calculateCartTotals(cart.items, cart.deliveryFee);
  const nextCart: Cart = {
    ...cart,
    ...totals,
    deliveryFee: totals.deliveryFee,
  };

  await setDoc(
    doc(database, "carts", cart.userId),
    {
      userId: nextCart.userId,
      items: nextCart.items,
      subtotal: nextCart.subtotal,
      deliveryFee: nextCart.deliveryFee,
      total: nextCart.total,
      checkout: nextCart.checkout,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return nextCart;
}

export async function getCart(userId: string): Promise<Cart> {
  const settings = await getOperationSettings();
  const snapshot = await getDoc(doc(database, "carts", userId));
  if (!snapshot.exists()) {
    return emptyCart(userId, settings.deliveryFee);
  }

  const data = snapshot.data() as Record<string, unknown>;
  const mapped = mapCart(userId, data);
  const quoteFeeCents = mapped.checkout?.deliveryQuote?.feeCents;
  const fee =
    typeof quoteFeeCents === "number"
      ? quoteFeeCents / 100
      : Number(data.deliveryFee ?? settings.deliveryFee);
  return {
    ...mapped,
    ...calculateCartTotals(mapped.items, fee),
  };
}

export async function addCartItem(
  userId: string,
  item: Omit<CartItem, "quantity" | "message"> & {
    quantity: number;
    message?: string;
  },
): Promise<Cart> {
  const cart = await getCart(userId);
  const existing = cart.items.find(
    (entry) => entry.productId === item.productId,
  );

  const items = existing
    ? cart.items.map((entry) =>
        entry.productId === item.productId
          ? {
              ...entry,
              quantity: entry.quantity + item.quantity,
              message: item.message?.trim() || entry.message,
            }
          : entry,
      )
    : [
        ...cart.items,
        {
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: Math.max(1, item.quantity),
          unitPrice: item.unitPrice,
          message: item.message?.trim() ?? "",
        },
      ];

  return persistCart({ ...cart, items });
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  const cart = await getCart(userId);
  if (quantity < 1) {
    return removeCartItem(userId, productId);
  }

  const items = cart.items.map((item) =>
    item.productId === productId ? { ...item, quantity } : item,
  );
  return persistCart({ ...cart, items });
}

export async function updateCartItemMessage(
  userId: string,
  productId: string,
  message: string,
): Promise<Cart> {
  const cart = await getCart(userId);
  const items = cart.items.map((item) =>
    item.productId === productId ? { ...item, message: message.trim() } : item,
  );
  return persistCart({ ...cart, items });
}

export async function removeCartItem(
  userId: string,
  productId: string,
): Promise<Cart> {
  const cart = await getCart(userId);
  const items = cart.items.filter((item) => item.productId !== productId);
  return persistCart({
    ...cart,
    items,
    checkout: items.length === 0 ? null : cart.checkout,
  });
}

export async function saveCheckoutDraft(
  userId: string,
  checkout: CheckoutDraft,
): Promise<Cart> {
  const cart = await getCart(userId);
  // deliveryQuote is owned by Cloud Functions (createDeliveryQuote). Never trust
  // client-supplied feeCents — preserve the server quote already on the cart.
  const safeCheckout: CheckoutDraft = {
    ...checkout,
    deliveryQuote: cart.checkout?.deliveryQuote ?? undefined,
  };
  const fee =
    typeof safeCheckout.deliveryQuote?.feeCents === "number"
      ? safeCheckout.deliveryQuote.feeCents / 100
      : cart.deliveryFee;
  return persistCart({
    ...cart,
    checkout: safeCheckout,
    deliveryFee: fee,
  });
}

export async function clearCart(userId: string): Promise<void> {
  await deleteDoc(doc(database, "carts", userId));
}
