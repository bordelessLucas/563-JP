import {
  CreatePaymentInput,
  PaymentProvider,
  PaymentSession,
  RefundResult,
} from "../providers/payment/types";
import { getPaymentProvider } from "../providers/payment/factory";
import { PaymentStatus } from "../domain/types";
import { canSimulateMockPayment } from "../config";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { mockPaymentProviderSingleton } from "../providers/payment/MockPaymentProvider";

/**
 * Generic payment orchestration — no Mercado Pago / Asaas details here.
 */
export class PaymentService {
  constructor(private readonly provider: PaymentProvider = getPaymentProvider()) {}

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    const session = await this.provider.createPayment(input);
    logger.info("payment.created", {
      provider: session.provider,
      paymentId: session.paymentId,
      orderId: input.orderId,
      amountCents: input.amountCents,
      status: session.status,
    });
    return session;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.provider.getPaymentStatus(paymentId);
  }

  async refundPayment(
    paymentId: string,
    amountCents?: number,
  ): Promise<RefundResult> {
    const result = await this.provider.refundPayment(paymentId, amountCents);
    logger.info("payment.refunded", {
      paymentId,
      status: result.status,
      refundedAmountCents: result.refundedAmountCents,
    });
    return result;
  }

  /**
   * Dev-only simulation. Fail-closed unless ENABLE_MOCK_PAYMENT=true
   * and PAYMENT_PROVIDER=mock and not production.
   */
  async simulateMockStatus(
    paymentId: string,
    status: Extract<PaymentStatus, "approved" | "failed" | "cancelled" | "pending">,
  ): Promise<PaymentStatus> {
    if (!canSimulateMockPayment()) {
      throw new AppError({
        code: "simulation_forbidden",
        message: "Mock payment simulation disabled (fail-closed)",
        publicMessage: "Simulação indisponível neste ambiente.",
        status: 403,
      });
    }
    return mockPaymentProviderSingleton.simulateStatus(paymentId, status);
  }
}

export const paymentService = new PaymentService();
