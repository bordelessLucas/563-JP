export type StockStatus = "in_stock" | "limited" | "out_of_stock";

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  active: boolean;
  order: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  images: string[];
  active: boolean;
  featured: boolean;
  stockStatus: StockStatus;
  /** Unidades disponíveis na loja (0 = indisponível). */
  stockQuantity: number;
  /** Em promoção (filtro do catálogo + destaque visual). */
  promo: boolean;
  /** Preço promocional; se válido e menor que price, é o valor cobrado. */
  promoPrice: number | null;
};

export type BannerDestination = {
  type: "category" | "product" | "collection" | "campaign";
  id: string;
};

export type Banner = {
  id: string;
  title: string;
  body: string;
  image: string;
  destination: BannerDestination;
  ctaLabel: string;
  /** Se true, candidata ao único modal na 1ª abertura (menor order = prioridade). */
  asModal: boolean;
  active: boolean;
  order: number;
};

export function stockStatusFromQuantity(quantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 5) return "limited";
  return "in_stock";
}

export function defaultStockQuantity(status: StockStatus): number {
  switch (status) {
    case "out_of_stock":
      return 0;
    case "limited":
      return 3;
    default:
      return 20;
  }
}

export function isProductOnPromo(product: Product): boolean {
  return Boolean(product.promo);
}

export function hasPromoDiscount(product: Product): boolean {
  return (
    isProductOnPromo(product) &&
    typeof product.promoPrice === "number" &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price
  );
}

export function productEffectivePrice(product: Product): number {
  if (hasPromoDiscount(product) && product.promoPrice != null) {
    return product.promoPrice;
  }
  return product.price;
}
