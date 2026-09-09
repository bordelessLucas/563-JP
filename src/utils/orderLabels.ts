export function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateTimeLabel(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "draft":
    case "awaiting_delivery_quote":
      return "Montando pedido";
    case "awaiting_payment":
    case "pending_payment":
      return "Aguardando pagamento";
    case "paid":
      return "Pedido confirmado";
    case "preparing":
      return "Preparando flores";
    case "ready_for_pickup":
    case "ready_for_delivery":
      return "Pronto para coleta";
    case "delivery_requested":
      return "Buscando entregador";
    case "courier_assigned":
      return "Entregador a caminho da floricultura";
    case "picked_up":
      return "Pedido coletado";
    case "out_for_delivery":
      return "Seu pedido está a caminho";
    case "delivered":
      return "Pedido entregue";
    case "cancellation_pending":
      return "Cancelamento em andamento";
    case "cancelled":
      return "Pedido cancelado";
    case "return_in_progress":
      return "Devolução em andamento";
    case "returned":
      return "Pedido devolvido";
    case "exception":
      return "Precisamos revisar seu pedido";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "pending_payment":
    case "pending":
    case "not_started":
      return "Pendente";
    case "paid":
    case "approved":
      return "Pago";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    case "refund_pending":
      return "Estorno pendente";
    case "refunded":
      return "Estornado";
    default:
      return status;
  }
}

export function paymentMethodLabel(method: string): string {
  return method === "card" ? "Cartão" : "PIX";
}

export function deliveryStatusLabel(status: string): string {
  switch (status) {
    case "not_started":
      return "Entrega ainda não solicitada";
    case "delivery_requested":
      return "Buscando entregador";
    case "driver_assigned":
    case "courier_assigned":
      return "Entregador encontrado";
    case "picked_up":
      return "Pedido coletado";
    case "in_transit":
    case "out_for_delivery":
      return "Saiu para entrega";
    case "delivered":
      return "Entregue";
    case "failed":
      return "Falha na entrega";
    case "cancelled":
      return "Entrega cancelada";
    case "returned":
      return "Devolvido";
    default:
      return status;
  }
}

/** Timeline visual para o cliente (sem GPS). */
export const CLIENT_TIMELINE_STEPS = [
  {
    key: "paid",
    label: "Pedido confirmado",
    match: [
      "paid",
      "preparing",
      "ready_for_pickup",
      "ready_for_delivery",
      "delivery_requested",
      "courier_assigned",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ],
  },
  {
    key: "preparing",
    label: "Preparando flores",
    match: [
      "preparing",
      "ready_for_pickup",
      "ready_for_delivery",
      "delivery_requested",
      "courier_assigned",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ],
  },
  {
    key: "ready_for_delivery",
    label: "Pronto para coleta",
    match: [
      "ready_for_pickup",
      "ready_for_delivery",
      "delivery_requested",
      "courier_assigned",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ],
  },
  {
    key: "delivery_requested",
    label: "Buscando entregador",
    match: [
      "delivery_requested",
      "courier_assigned",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ],
  },
  {
    key: "courier_assigned",
    label: "Entregador a caminho da floricultura",
    match: ["courier_assigned", "picked_up", "out_for_delivery", "delivered"],
  },
  {
    key: "picked_up",
    label: "Pedido coletado",
    match: ["picked_up", "out_for_delivery", "delivered"],
  },
  {
    key: "out_for_delivery",
    label: "Saiu para entrega",
    match: ["out_for_delivery", "delivered"],
  },
  { key: "delivered", label: "Pedido entregue", match: ["delivered"] },
] as const;
