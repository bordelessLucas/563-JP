import {
  AsaasProviderPlaceholder,
} from "./AsaasProvider.placeholder";
import { MercadoPagoProviderPlaceholder } from "./MercadoPagoProvider.placeholder";
import { mockPaymentProviderSingleton } from "./MockPaymentProvider";
import { PaymentProvider } from "./types";
import { getPaymentProviderId } from "../../config";
import { AppError } from "../../lib/errors";

export function getPaymentProvider(): PaymentProvider {
  const id = getPaymentProviderId();
  switch (id) {
    case "mock":
      return mockPaymentProviderSingleton;
    case "mercadopago":
      throw new AppError({
        code: "PAYMENT_PROVIDER_NOT_IMPLEMENTED",
        message: "MercadoPagoProvider not implemented yet",
        publicMessage: "Gateway de pagamento ainda não configurado.",
        status: 501,
      });
    case "asaas":
      throw new AppError({
        code: "PAYMENT_PROVIDER_NOT_IMPLEMENTED",
        message: "AsaasProvider not implemented yet",
        publicMessage: "Gateway de pagamento ainda não configurado.",
        status: 501,
      });
    default:
      throw new AppError({
        code: "payment_provider_unknown",
        message: `Unknown payment provider ${id}`,
        publicMessage: "Gateway de pagamento indisponível.",
        status: 503,
      });
  }
}

// Keep placeholder classes importable for future wiring without silent activation.
export { AsaasProviderPlaceholder, MercadoPagoProviderPlaceholder };
