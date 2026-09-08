import AsyncStorage from "@react-native-async-storage/async-storage";

const PROMO_MODAL_SEEN_KEY = "flora_promo_modal_seen_v1";

export async function hasSeenPromoModal(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PROMO_MODAL_SEEN_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function markPromoModalSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(PROMO_MODAL_SEEN_KEY, "1");
  } catch {
    // ignore persistence errors — modal just won't stay dismissed across restarts
  }
}
