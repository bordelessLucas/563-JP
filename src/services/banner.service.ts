import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { Banner, BannerDestination } from "@/src/types/catalog";

const database = getFirestore(firebaseApp);

function mapBanner(id: string, data: Record<string, unknown>): Banner {
  const destinationData = (data.destination ?? {}) as Record<string, string>;
  return {
    id,
    title: String(data.title ?? ""),
    image: String(data.image ?? ""),
    destination: {
      type: (destinationData.type as BannerDestination["type"]) ?? "category",
      id: String(destinationData.id ?? ""),
    },
    active: Boolean(data.active),
    order: Number(data.order ?? 0),
  };
}

export async function listActiveBanners(): Promise<Banner[]> {
  const snapshot = await getDocs(
    query(collection(database, "banners"), where("active", "==", true)),
  );
  return snapshot.docs
    .map((item) => mapBanner(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.order - right.order);
}

export async function listAllBanners(): Promise<Banner[]> {
  const snapshot = await getDocs(collection(database, "banners"));
  return snapshot.docs
    .map((item) => mapBanner(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.order - right.order);
}

export type BannerInput = {
  title: string;
  image: string;
  destination: BannerDestination;
  active: boolean;
  order: number;
};

export async function createBanner(input: BannerInput): Promise<Banner> {
  const payload = {
    ...input,
    title: input.title.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const reference = await addDoc(collection(database, "banners"), payload);
  return mapBanner(reference.id, payload);
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>,
): Promise<void> {
  await updateDoc(doc(database, "banners", id), {
    ...input,
    ...(input.title ? { title: input.title.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}
