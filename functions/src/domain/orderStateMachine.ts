import { AppError } from "../lib/errors";
import { OrderStatus } from "./types";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["awaiting_delivery_quote", "awaiting_payment", "cancelled"],
  awaiting_delivery_quote: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "pending_payment", "cancelled", "exception"],
  pending_payment: ["paid", "cancelled", "exception", "awaiting_payment"],
  paid: ["preparing", "cancellation_pending", "cancelled", "exception"],
  preparing: [
    "ready_for_pickup",
    "ready_for_delivery",
    "cancellation_pending",
    "cancelled",
    "exception",
  ],
  ready_for_pickup: [
    "delivery_requested",
    "ready_for_delivery",
    "cancellation_pending",
    "exception",
  ],
  ready_for_delivery: [
    "delivery_requested",
    "out_for_delivery",
    "cancellation_pending",
    "exception",
  ],
  delivery_requested: [
    "courier_assigned",
    "picked_up",
    "out_for_delivery",
    "cancellation_pending",
    "cancelled",
    "exception",
  ],
  courier_assigned: [
    "picked_up",
    "out_for_delivery",
    "cancellation_pending",
    "cancelled",
    "exception",
  ],
  picked_up: ["out_for_delivery", "delivered", "return_in_progress", "exception"],
  out_for_delivery: ["delivered", "return_in_progress", "exception"],
  delivered: [],
  cancellation_pending: ["cancelled", "exception"],
  cancelled: [],
  return_in_progress: ["returned", "exception"],
  returned: [],
  exception: ["preparing", "ready_for_pickup", "cancellation_pending", "cancelled"],
};

const TERMINAL: OrderStatus[] = ["delivered", "cancelled", "returned"];

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrderStatus(from, to)) {
    throw new AppError({
      code: "invalid_order_transition",
      message: `Invalid order transition ${from} → ${to}`,
      publicMessage: "Não é possível alterar o status do pedido dessa forma.",
      status: 409,
    });
  }
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

/** Prefer newer event only if not regressing a terminal status. */
export function shouldApplyOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === next) return false;
  if (isTerminalOrderStatus(current) && current !== next) return false;
  return canTransitionOrderStatus(current, next);
}
