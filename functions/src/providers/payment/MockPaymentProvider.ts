import { randomUUID } from "crypto";

import { PaymentStatus } from "../../domain/types";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import {
  CreatePaymentInput,
  PaymentProvider,
  PaymentSession,
  RefundResult,
} from "./types";

type MockPayment = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  currency: "BRL";
  method: "pix" | "card";
  createdAt: string;
  approvedAt?: string;
  refundedAt?: string;
};

export class MockPaymentProvider implements PaymentProvider {
  private readonly payments = new Map<string, MockPayment>();

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    const payment: MockPayment = {
      id: `mock_pay_${randomUUID()}`,
      status: "pending",
      amountCents: input.amountCents,
      currency: input.currency,
      method: input.method,
      createdAt: new Date().toISOString(),
    };
    this.payments.set(payment.id, payment);
    logger.info("mock.payment.created", {
      paymentId: payment.id,
      orderId: input.orderId,
      amountCents: input.amountCents,
    });
    return {
      provider: "mock",
      paymentId: payment.id,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      pixCopyPaste:
        input.method === "pix"
          ? "00020126580014BR.GOV.BCB.PIX0136MOCK-PAYMENT-DEMO"
          : undefined,
      createdAt: payment.createdAt,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = this.require(paymentId);
    return payment.status;
  }

  async simulateStatus(
    paymentId: string,
    status: Extract<PaymentStatus, "approved" | "failed" | "cancelled" | "pending">,
  ): Promise<PaymentStatus> {
    // Cloud Functions instances do not share memory — recreate ephemeral state
    // when this paymentId was created on another instance.
    const payment =
      this.payments.get(paymentId) ??
      ({
        id: paymentId,
        status: "pending" as PaymentStatus,
        amountCents: 0,
        currency: "BRL" as const,
        method: "pix" as const,
        createdAt: new Date().toISOString(),
      } satisfies MockPayment);
    payment.status = status;
    if (status === "approved") {
      payment.approvedAt = new Date().toISOString();
    }
    this.payments.set(paymentId, payment);
    logger.info("mock.payment.simulated", { paymentId, status });
    return status;
  }

  async refundPayment(
    paymentId: string,
    amountCents?: number,
  ): Promise<RefundResult> {
    const payment = this.require(paymentId);
    if (payment.status !== "approved" && payment.status !== "refund_pending") {
      throw new AppError({
        code: "refund_not_allowed",
        message: `Cannot refund payment in status ${payment.status}`,
        publicMessage: "Não é possível reembolsar este pagamento.",
        status: 409,
      });
    }
    payment.status = "refund_pending";
    this.payments.set(paymentId, payment);

    payment.status = "refunded";
    payment.refundedAt = new Date().toISOString();
    this.payments.set(paymentId, payment);

    return {
      paymentId,
      status: "refunded",
      refundedAmountCents: amountCents ?? payment.amountCents,
    };
  }

  private require(paymentId: string): MockPayment {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new AppError({
        code: "payment_not_found",
        message: "Mock payment not found",
        publicMessage: "Pagamento não encontrado.",
        status: 404,
      });
    }
    return payment;
  }
}

export const mockPaymentProviderSingleton = new MockPaymentProvider();
