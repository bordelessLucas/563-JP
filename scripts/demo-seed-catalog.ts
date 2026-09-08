/**
 * Seed de catálogo/demo para Firestore (jp-6a9d2).
 * Mídia: ver `scripts/demo-media.ts` (URLs Unsplash verificadas).
 *
 * Coleções:
 * - categories: flores, buques, arranjos, presentes, complementos
 * - products: 8 originais + orquidea-rosa (qty 0) — 3 imagens cada
 * - banners: banner-primavera (hero), promo-semana (modal ativo), promo-rascunho (inativo)
 * - settings/operation: deliveryFee + períodos
 */
import { DEMO_MEDIA } from "./demo-media";

export const DEMO_SEED = {
  media: DEMO_MEDIA,
  products: [
    { id: "rosa-vermelha", price: 32.9, stockQuantity: 25, stockStatus: "in_stock", promo: false },
    { id: "buque-romance", price: 199.9, promoPrice: 169.9, stockQuantity: 18, stockStatus: "in_stock", promo: true },
    { id: "arranjo-jardim", price: 259, stockQuantity: 12, stockStatus: "in_stock", promo: false },
    { id: "girassol", price: 44.9, promoPrice: 34.9, stockQuantity: 30, stockStatus: "in_stock", promo: true },
    { id: "buque-lirios", price: 229, stockQuantity: 3, stockStatus: "limited", promo: false },
    { id: "centro-mesa", price: 189.9, stockQuantity: 15, stockStatus: "in_stock", promo: false },
    { id: "kit-encanto", price: 169.9, stockQuantity: 8, stockStatus: "in_stock", promo: false },
    { id: "chocolates", price: 74.9, promoPrice: 59.9, stockQuantity: 40, stockStatus: "in_stock", promo: true },
    { id: "orquidea-rosa", price: 189, stockQuantity: 0, stockStatus: "out_of_stock", promo: false },
  ],
  banners: [
    {
      id: "promo-semana",
      title: "Promoção da semana",
      asModal: true,
      active: true,
      order: 1,
      destination: { type: "product", id: "buque-romance" },
    },
    {
      id: "banner-primavera",
      title: "Um gesto que floresce",
      asModal: false,
      active: true,
      order: 2,
      destination: { type: "category", id: "flores" },
    },
    {
      id: "promo-rascunho",
      title: "Campanha rascunho",
      asModal: true,
      active: false,
      order: 3,
      destination: { type: "collection", id: "" },
    },
  ],
} as const;
