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
import { Product, StockStatus } from "@/src/types/catalog";

const database = getFirestore(firebaseApp);

function mapProduct(id: string, data: Record<string, unknown>): Product {
  const images = Array.isArray(data.images)
    ? data.images.map((image) => String(image))
    : [];

  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    categoryId: String(data.categoryId ?? ""),
    price: Number(data.price ?? 0),
    images,
    active: Boolean(data.active),
    featured: Boolean(data.featured),
    stockStatus: (data.stockStatus as StockStatus) ?? "in_stock",
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
  stockStatus: StockStatus;
};

export async function createProduct(input: ProductInput): Promise<Product> {
  const payload = {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
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
  await updateDoc(doc(database, "products", id), {
    ...input,
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.description ? { description: input.description.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}
