/**
 * PLACEHOLDER — do not use in production.
 * Implement AsaasProvider against PaymentProvider when the client chooses Asaas.
 */
import { AppError } from "../../lib/errors";
import {
  CreatePaymentInput,
  PaymentProvider,
  PaymentSession,
  RefundResult,
} from "./types";

export class AsaasProviderPlaceholder implements PaymentProvider {
  async createPayment(_input: CreatePaymentInput): Promise<PaymentSession> {
    throw new AppError({
      code: "payment_provider_not_implemented",
      message: "AsaasProvider not implemented yet",
      publicMessage: "Gateway de pagamento ainda não configurado.",
      status: 501,
    });
  }

  async getPaymentStatus(): Promise<never> {
    throw new AppError({
      code: "payment_provider_not_implemented",
      message: "AsaasProvider not implemented yet",
      publicMessage: "Gateway de pagamento ainda não configurado.",
      status: 501,
    });
  }

  async refundPayment(): Promise<RefundResult> {
    throw new AppError({
      code: "payment_provider_not_implemented",
      message: "AsaasProvider not implemented yet",
      publicMessage: "Gateway de pagamento ainda não configurado.",
      status: 501,
    });
  }
}
