import * as admin from "firebase-admin";

import { getStoreConfigFromEnv } from "../config";
import { NormalizedAddress, StoreConfig } from "../domain/types";
import { AppError } from "../lib/errors";
import { addCents, assertCents, fromCents, subtractCents, toCents } from "../lib/money";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export type PricedItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPriceCents: number;
  message: string;
};

export async function loadStoreConfig(): Promise<StoreConfig> {
  const snap = await db.doc("settings/store").get();
  const envFallback = getStoreConfigFromEnv();
  if (!snap.exists) return envFallback;
  const data = snap.data() ?? {};
  return {
    name: String(data.name ?? envFallback.name),
    phone: String(data.phone ?? envFallback.phone),
    street: String(data.street ?? envFallback.street),
    number: String(data.number ?? envFallback.number),
    complement: data.complement ? String(data.complement) : undefined,
    neighborhood: String(data.neighborhood ?? envFallback.neighborhood),
    city: String(data.city ?? envFallback.city),
    state: String(data.state ?? envFallback.state),
    cep: String(data.cep ?? envFallback.cep),
    country: String(data.country ?? "BR"),
    latitude:
      data.latitude != null ? Number(data.latitude) : envFallback.latitude,
    longitude:
      data.longitude != null ? Number(data.longitude) : envFallback.longitude,
    preparationMinutes: Number(
      data.preparationMinutes ?? envFallback.preparationMinutes,
    ),
  };
}

export function normalizeAddress(input: {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  country?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
}): NormalizedAddress {
  const street = String(input.street ?? "").trim();
  const number = String(input.number ?? "").trim();
  const neighborhood = String(input.neighborhood ?? "").trim();
  const city = String(input.city ?? "").trim();
  const state = String(input.state ?? "").trim().toUpperCase();
  const cep = String(input.cep ?? "").replace(/\D/g, "");
  const country = String(input.country ?? "BR").trim().toUpperCase() || "BR";

  if (!street || !number || !neighborhood || !city || !state || cep.length < 8) {
    throw new AppError({
      code: "invalid_address",
      message: "Incomplete address",
      publicMessage: "Endereço incompleto. Confira rua, número, cidade, UF e CEP.",
      status: 400,
    });
  }

  return {
    street,
    number,
    complement: input.complement?.trim() || undefined,
    neighborhood,
    city,
    state,
    cep,
    country,
    reference: input.reference?.trim() || undefined,
    latitude:
      input.latitude != null && Number.isFinite(input.latitude)
        ? Number(input.latitude)
        : undefined,
    longitude:
      input.longitude != null && Number.isFinite(input.longitude)
        ? Number(input.longitude)
        : undefined,
  };
}

export async function priceCartItems(
  items: Array<{
    productId: string;
    quantity: number;
    message?: string;
  }>,
): Promise<{ items: PricedItem[]; subtotalCents: number }> {
  if (!items.length) {
    throw new AppError({
      code: "empty_cart",
      message: "Cart has no items",
      publicMessage: "Seu carrinho está vazio.",
      status: 400,
    });
  }

  const priced: PricedItem[] = [];
  let subtotalCents = 0;

  for (const item of items) {
    const qty = Math.floor(Number(item.quantity));
    if (!item.productId || !Number.isFinite(qty) || qty < 1) {
      throw new AppError({
        code: "invalid_item",
        message: "Invalid cart item",
        publicMessage: "Há um item inválido no carrinho.",
        status: 400,
      });
    }

    const snap = await db.doc(`products/${item.productId}`).get();
    if (!snap.exists) {
      throw new AppError({
        code: "product_not_found",
        message: `Product ${item.productId} not found`,
        publicMessage: "Um produto do carrinho não está mais disponível.",
        status: 400,
      });
    }
    const data = snap.data() ?? {};
    if (data.active === false) {
      throw new AppError({
        code: "product_inactive",
        message: `Product ${item.productId} inactive`,
        publicMessage: "Um produto do carrinho não está mais disponível.",
        status: 400,
      });
    }

    const stockQty = Number(data.stockQuantity ?? 0);
    const stockStatus = String(data.stockStatus ?? "in_stock");
    if (stockStatus === "out_of_stock" || stockQty <= 0) {
      throw new AppError({
        code: "product_out_of_stock",
        message: `Product ${item.productId} out of stock`,
        publicMessage: `${String(data.name ?? "Produto")} está indisponível.`,
        status: 409,
      });
    }
    if (qty > stockQty) {
      throw new AppError({
        code: "insufficient_stock",
        message: `Insufficient stock for ${item.productId}`,
        publicMessage: `Estoque insuficiente para ${String(data.name ?? "produto")}.`,
        status: 409,
      });
    }

    const basePrice = Number(data.price ?? 0);
    const promo = Boolean(data.promo);
    const promoPrice = Number(data.promoPrice ?? basePrice);
    const unitReais = promo && promoPrice > 0 ? promoPrice : basePrice;
    const unitPriceCents = toCents(unitReais);
    const line = unitPriceCents * qty;
    subtotalCents = addCents(subtotalCents, line);

    const images = Array.isArray(data.images) ? data.images : [];
    priced.push({
      productId: item.productId,
      productName: String(data.name ?? item.productId),
      productImage: images[0] ? String(images[0]) : undefined,
      quantity: qty,
      unitPriceCents,
      message: String(item.message ?? "").trim(),
    });
  }

  return { items: priced, subtotalCents: assertCents(subtotalCents) };
}

export function buildPricing(input: {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents?: number;
}) {
  const discountCents = assertCents(input.discountCents ?? 0);
  const totalCents = subtractCents(
    addCents(input.subtotalCents, input.deliveryFeeCents),
    discountCents,
  );
  return {
    pricing: {
      subtotalCents: assertCents(input.subtotalCents),
      deliveryFeeCents: assertCents(input.deliveryFeeCents),
      discountCents,
      totalCents,
      currency: "BRL" as const,
    },
    subtotal: fromCents(input.subtotalCents),
    deliveryFee: fromCents(input.deliveryFeeCents),
    total: fromCents(totalCents),
  };
}
