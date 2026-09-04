import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { DeliveryAddressDraft, SavedAddress } from "@/src/types/checkout";

const database = getFirestore(firebaseApp);

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  const snapshot = await getDocs(
    query(collection(database, "addresses"), where("userId", "==", userId)),
  );

  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      userId: String(data.userId ?? userId),
      cep: String(data.cep ?? ""),
      street: String(data.street ?? ""),
      number: String(data.number ?? ""),
      complement: String(data.complement ?? ""),
      neighborhood: String(data.neighborhood ?? ""),
      city: String(data.city ?? ""),
      state: String(data.state ?? ""),
      reference: String(data.reference ?? ""),
    } satisfies SavedAddress;
  });
}

export async function createAddress(
  userId: string,
  address: DeliveryAddressDraft,
): Promise<SavedAddress> {
  const payload = {
    userId,
    cep: address.cep.trim(),
    street: address.street.trim(),
    number: address.number.trim(),
    complement: address.complement.trim(),
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    reference: address.reference.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reference = await addDoc(collection(database, "addresses"), payload);
  return {
    id: reference.id,
    userId,
    cep: payload.cep,
    street: payload.street,
    number: payload.number,
    complement: payload.complement,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
    reference: payload.reference,
  };
}
