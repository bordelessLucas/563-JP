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
    body: String(data.body ?? data.description ?? ""),
    image: String(data.image ?? ""),
    destination: {
      type: (destinationData.type as BannerDestination["type"]) ?? "category",
      id: String(destinationData.id ?? ""),
    },
    ctaLabel: String(data.ctaLabel ?? "Ver oferta"),
    asModal: Boolean(data.asModal),
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

/** Hero grande: campanhas ativas que NÃO usam modal. */
export async function listActiveHeroBanners(): Promise<Banner[]> {
  const banners = await listActiveBanners();
  return banners.filter((banner) => !banner.asModal);
}

/**
 * Faixa de promoções na home (modal e não-modal).
 * Todas as campanhas ativas, por ordem.
 */
export async function listHomePromotions(): Promise<Banner[]> {
  return listActiveBanners();
}

/**
 * Única promoção elegível ao modal de 1ª abertura:
 * ativa + asModal + menor order (máxima prioridade).
 */
export async function getActivePromoModal(): Promise<Banner | null> {
  const banners = await listActiveBanners();
  const modalEligible = banners.filter((banner) => banner.asModal);
  return modalEligible[0] ?? null;
}

export async function listAllBanners(): Promise<Banner[]> {
  const snapshot = await getDocs(collection(database, "banners"));
  return snapshot.docs
    .map((item) => mapBanner(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.order - right.order);
}

export type BannerInput = {
  title: string;
  body: string;
  image: string;
  destination: BannerDestination;
  ctaLabel: string;
  asModal: boolean;
  active: boolean;
  order: number;
};

export async function createBanner(input: BannerInput): Promise<Banner> {
  const payload = {
    ...input,
    title: input.title.trim(),
    body: input.body.trim(),
    ctaLabel: input.ctaLabel.trim() || "Ver oferta",
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
    ...(input.body !== undefined ? { body: input.body.trim() } : {}),
    ...(input.ctaLabel !== undefined
      ? { ctaLabel: input.ctaLabel.trim() || "Ver oferta" }
      : {}),
    updatedAt: serverTimestamp(),
  });
}
