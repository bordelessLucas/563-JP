import { DeliveryStatus, OrderStatus } from "./types";

export function clientOrderStatusLabel(status: OrderStatus): string {
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
      return "Atualizando status";
  }
}

export function clientDeliveryStatusLabel(status: DeliveryStatus | string): string {
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
      return "Atualizando entrega";
  }
}
