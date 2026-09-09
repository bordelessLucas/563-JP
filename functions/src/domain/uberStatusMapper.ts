import { DeliveryStatus, OrderStatus } from "./types";

const UBER_TO_DELIVERY: Record<string, DeliveryStatus> = {
  pending: "delivery_requested",
  pickup: "courier_assigned",
  pickup_complete: "picked_up",
  dropoff: "out_for_delivery",
  delivered: "delivered",
  canceled: "cancelled",
  cancelled: "cancelled",
  returned: "returned",
  courier_imminent: "out_for_delivery",
};

const UBER_TO_ORDER: Record<string, OrderStatus> = {
  pending: "delivery_requested",
  pickup: "courier_assigned",
  pickup_complete: "picked_up",
  dropoff: "out_for_delivery",
  delivered: "delivered",
  canceled: "cancelled",
  cancelled: "cancelled",
  returned: "returned",
  courier_imminent: "out_for_delivery",
};

export function mapUberDeliveryStatus(uberStatus: string): DeliveryStatus | null {
  const key = uberStatus.trim().toLowerCase();
  return UBER_TO_DELIVERY[key] ?? null;
}

export function mapUberOrderStatus(uberStatus: string): OrderStatus | null {
  const key = uberStatus.trim().toLowerCase();
  return UBER_TO_ORDER[key] ?? null;
}
