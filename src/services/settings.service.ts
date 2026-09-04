import { doc, getDoc, getFirestore } from "firebase/firestore";

import { firebaseApp } from "@/src/services/firebase";
import { DeliveryPeriod, OperationSettings } from "@/src/types/checkout";

const database = getFirestore(firebaseApp);

const fallbackSettings: OperationSettings = {
  deliveryFee: 19.9,
  periods: [
    { id: "morning", label: "Manhã", active: true },
    { id: "afternoon", label: "Tarde", active: true },
    { id: "evening", label: "Noite", active: true },
  ],
};

export async function getOperationSettings(): Promise<OperationSettings> {
  const snapshot = await getDoc(doc(database, "settings", "operation"));
  if (!snapshot.exists()) return fallbackSettings;

  const data = snapshot.data();
  const periods = Array.isArray(data.periods)
    ? (data.periods as DeliveryPeriod[]).filter((period) => period.active)
    : fallbackSettings.periods;

  return {
    deliveryFee: Number(data.deliveryFee ?? fallbackSettings.deliveryFee),
    periods: periods.length > 0 ? periods : fallbackSettings.periods,
  };
}
