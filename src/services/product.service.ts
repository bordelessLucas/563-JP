import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import {
  defaultStockQuantity,
  Product,
  StockStatus,
  stockStatusFromQuantity,
} from "@/src/types/catalog";

const database = getFirestore(firebaseApp);

function mapProduct(id: string, data: Record<string, unknown>): Product {
  const images = Array.isArray(data.images)
    ? data.images.map((image) => String(image))
    : [];
  const stockStatus = (data.stockStatus as StockStatus) ?? "in_stock";
  const rawQty = data.stockQuantity;
  const stockQuantity =
    typeof rawQty === "number" && Number.isFinite(rawQty)
      ? Math.max(0, Math.floor(rawQty))
      : defaultStockQuantity(stockStatus);
  const rawPromoPrice = data.promoPrice;
  const promoPrice =
    typeof rawPromoPrice === "number" && Number.isFinite(rawPromoPrice)
      ? rawPromoPrice
      : null;

  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    categoryId: String(data.categoryId ?? ""),
    price: Number(data.price ?? 0),
    images,
    active: Boolean(data.active),
    featured: Boolean(data.featured),
    stockQuantity,
    stockStatus: stockStatusFromQuantity(stockQuantity),
    promo: Boolean(data.promo),
    promoPrice,
  };
}

export async function listActiveProducts(
  categoryId?: string,
): Promise<Product[]> {
  const snapshot = await getDocs(
    query(collection(database, "products"), where("active", "==", true)),
  );

  const products = snapshot.docs.map((item) =>
    mapProduct(item.id, item.data() as Record<string, unknown>),
  );

  if (!categoryId) return products;
  return products.filter((product) => product.categoryId === categoryId);
}

export async function listAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(database, "products"));
  return snapshot.docs.map((item) =>
    mapProduct(item.id, item.data() as Record<string, unknown>),
  );
}

export async function listFeaturedProducts(): Promise<Product[]> {
  const products = await listActiveProducts();
  return products.filter((product) => product.featured);
}

export async function listPromoProducts(): Promise<Product[]> {
  const products = await listActiveProducts();
  return products.filter((product) => product.promo);
}

export async function getProductById(id: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(database, "products", id));
  if (!snapshot.exists()) return null;
  const product = mapProduct(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
  return product.active ? product : null;
}

export async function getProductByIdAdmin(
  id: string,
): Promise<Product | null> {
  const snapshot = await getDoc(doc(database, "products", id));
  if (!snapshot.exists()) return null;
  return mapProduct(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export type ProductInput = {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  images: string[];
  active: boolean;
  featured: boolean;
  stockQuantity: number;
  stockStatus: StockStatus;
  promo: boolean;
  promoPrice: number | null;
};

function normalizeProductInput(input: ProductInput) {
  const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
  const promoPrice =
    input.promo &&
    typeof input.promoPrice === "number" &&
    Number.isFinite(input.promoPrice)
      ? input.promoPrice
      : null;
  return {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    stockQuantity,
    stockStatus: stockStatusFromQuantity(stockQuantity),
    promo: Boolean(input.promo),
    promoPrice,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const payload = {
    ...normalizeProductInput(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(database, "products"), payload);
  return mapProduct(reference.id, payload);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<void> {
  const next: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (input.name) next.name = input.name.trim();
  if (input.description !== undefined) {
    next.description = input.description.trim();
  }
  if (input.stockQuantity !== undefined) {
    const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
    next.stockQuantity = stockQuantity;
    next.stockStatus = stockStatusFromQuantity(stockQuantity);
  }
  if (input.promo !== undefined) {
    next.promo = Boolean(input.promo);
  }
  if (input.promoPrice !== undefined || input.promo === false) {
    next.promoPrice =
      input.promo === false
        ? null
        : typeof input.promoPrice === "number" && Number.isFinite(input.promoPrice)
          ? input.promoPrice
          : null;
  }
  await updateDoc(doc(database, "products", id), next);
}
