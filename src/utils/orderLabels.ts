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
    case "pending_payment":
      return "Aguardando pagamento";
    case "paid":
      return "Confirmado";
    case "preparing":
      return "Preparando";
    case "ready_for_delivery":
      return "Pronto para entrega";
    case "out_for_delivery":
      return "Saiu para entrega";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "pending_payment":
      return "Pendente";
    case "paid":
      return "Pago";
    case "failed":
      return "Falhou";
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
      return "Não iniciada";
    case "delivery_requested":
      return "Solicitada";
    case "driver_assigned":
      return "Entregador definido";
    case "picked_up":
      return "Coletado";
    case "in_transit":
      return "Em trânsito";
    case "delivered":
      return "Entregue";
    case "failed":
      return "Falha";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

/** Timeline visual para o cliente (sem GPS). */
export const CLIENT_TIMELINE_STEPS = [
  {
    key: "paid",
    label: "Confirmado",
    match: [
      "paid",
      "preparing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
    ],
  },
  {
    key: "preparing",
    label: "Preparando",
    match: ["preparing", "ready_for_delivery", "out_for_delivery", "delivered"],
  },
  {
    key: "ready_for_delivery",
    label: "Pronto para entrega",
    match: ["ready_for_delivery", "out_for_delivery", "delivered"],
  },
  {
    key: "out_for_delivery",
    label: "Saiu para entrega",
    match: ["out_for_delivery", "delivered"],
  },
  { key: "delivered", label: "Entregue", match: ["delivered"] },
] as const;
