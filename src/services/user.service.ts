import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";

export type ClientProfile = {
  uid: string;
  name: string;
  email: string;
  role: "client";
  createdAt: ReturnType<typeof serverTimestamp>;
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
  } satisfies ClientProfile);
}
