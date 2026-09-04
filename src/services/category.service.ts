import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { Category } from "@/src/types/catalog";

const database = getFirestore(firebaseApp);

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? id),
    image: String(data.image ?? ""),
    active: Boolean(data.active),
    order: Number(data.order ?? 0),
  };
}

export async function listActiveCategories(): Promise<Category[]> {
  const snapshot = await getDocs(
    query(collection(database, "categories"), where("active", "==", true)),
  );
  return snapshot.docs
    .map((item) => mapCategory(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.order - right.order);
}

export async function listAllCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(database, "categories"));
  return snapshot.docs
    .map((item) => mapCategory(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.order - right.order);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const snapshot = await getDoc(doc(database, "categories", id));
  if (!snapshot.exists()) return null;
  return mapCategory(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export type CategoryInput = {
  name: string;
  slug: string;
  image: string;
  active: boolean;
  order: number;
};

export async function createCategory(input: CategoryInput): Promise<Category> {
  const payload = {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(database, "categories"), payload);
  return mapCategory(reference.id, payload);
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<void> {
  await updateDoc(doc(database, "categories", id), {
    ...input,
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.slug ? { slug: input.slug.trim().toLowerCase() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function upsertCategory(
  id: string,
  input: CategoryInput,
): Promise<void> {
  await setDoc(
    doc(database, "categories", id),
    {
      ...input,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
