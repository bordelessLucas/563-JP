import { PaymentProviderId, PaymentStatus } from "../../domain/types";

export type CreatePaymentInput = {
  orderId: string;
  amountCents: number;
  currency: "BRL";
  method: "pix" | "card";
  customer: {
    id: string;
    name: string;
    email: string;
  };
  description?: string;
};

export type PaymentSession = {
  provider: PaymentProviderId;
  paymentId: string;
  status: PaymentStatus;
  amountCents: number;
  currency: "BRL";
  checkoutUrl?: string;
  pixCopyPaste?: string;
  createdAt: string;
};

export type RefundResult = {
  paymentId: string;
  status: PaymentStatus;
  refundedAmountCents: number;
};

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amountCents?: number): Promise<RefundResult>;
}
