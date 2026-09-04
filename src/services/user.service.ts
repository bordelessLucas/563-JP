import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";

export type UserRole = "client" | "admin";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const database = getFirestore(firebaseApp);

export async function createClientProfile(
  uid: string,
  name: string,
  email: string,
): Promise<void> {
  await setDoc(doc(database, "users", uid), {
    uid,
    name,
    email,
    role: "client",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } satisfies UserProfile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(database, "users", uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}
