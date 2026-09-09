import * as Clipboard from "expo-clipboard";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { FirebaseError } from "firebase/app";

import { Button } from "@/src/components/Button";
import { CheckoutStepper } from "@/src/components/CheckoutStepper";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCart } from "@/src/contexts/CartContext";
import {
  createCheckout,
  simulateMockPayment,
} from "@/src/services/backend.service";
import { PaymentMethod } from "@/src/types/order";
import {
  checkoutRecoveryHref,
  isCartReadyForPayment,
} from "@/src/utils/checkout";
import { formatCurrency } from "@/src/utils/format";

type PaymentPhase = "choose" | "awaiting" | "failed";

const MOCK_PIX_CODE =
  "00020126580014BR.GOV.BCB.PIX0136MOCK-PAYMENT-DEMO5204000053039865802BR5925JP FLORES DEMO MVP6009SAO PAULO62070503***6304ABCD";

export default function CheckoutPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string }>();
  const { user, profile } = useAuth();
  const { cart, refreshCart } = useCart();

  const initialMethod: PaymentMethod =
    params.method === "card" ? "card" : "pix";

  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [phase, setPhase] = useState<PaymentPhase>("choose");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState(MOCK_PIX_CODE);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);

  const totalLabel = useMemo(
    () => formatCurrency(cart?.total ?? 0),
    [cart?.total],
  );

  const hasItems = Boolean(cart && cart.items.length > 0);
  const readyToPay = isCartReadyForPayment(cart);

  async function copyPix() {
    await Clipboard.setStringAsync(pixCode);
    Alert.alert("Copiado", "Código de exemplo copiado.");
  }

  async function goToSuccess(orderId: string, orderNumber: string) {
    router.replace(
      `/checkout/success?orderId=${orderId}&orderNumber=${encodeURIComponent(orderNumber)}` as Href,
    );
  }

  async function simulateApprove() {
    if (!user || !cart || cart.items.length === 0) return;
    if (!readyToPay || !cart.checkout?.address || !cart.checkout.recipient) {
      setError("Complete destinatário, endereço e agenda antes de pagar.");
      router.replace(checkoutRecoveryHref(cart.checkout) as Href);
      return;
    }

    setBusy(true);
    setError(null);
    setQuoteNotice(null);
    setPhase("awaiting");

    let createdOrderId: string | null = null;
    let createdOrderNumber: string | null = null;

    try {
      const checkout = await createCheckout({
        customerName: profile?.name ?? user.displayName ?? "Cliente",
        customerEmail: profile?.email ?? user.email ?? "",
        paymentMethod: method,
        recipient: {
          name: cart.checkout.recipient.name,
          phone: cart.checkout.recipient.phone,
          notes: cart.checkout.recipient.notes,
        },
        address: cart.checkout.address,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          message: item.message,
        })),
        deliveryDate: cart.checkout.deliveryDate ?? "",
        deliveryPeriodId: cart.checkout.deliveryPeriodId ?? "",
        deliveryPeriodLabel: cart.checkout.deliveryPeriodLabel ?? "",
        existingQuote: cart.checkout.deliveryQuote ?? undefined,
      });

      createdOrderId = checkout.orderId;
      createdOrderNumber = checkout.orderNumber;
      if (checkout.paymentSession.pixCopyPaste) {
        setPixCode(checkout.paymentSession.pixCopyPaste);
      }
      if (checkout.quoteRefreshed) {
        setQuoteNotice(
          `Frete recalculado: ${formatCurrency(checkout.deliveryFee)}. Total ${formatCurrency(checkout.total)}.`,
        );
      }

      const payment = await simulateMockPayment({
        orderId: checkout.orderId,
        outcome: "approved",
      });

      if (payment.paymentStatus !== "approved") {
        throw new Error("Pagamento não aprovado.");
      }

      try {
        await refreshCart();
      } catch {
        /* cart already cleared by backend */
      }

      await goToSuccess(checkout.orderId, checkout.orderNumber);
    } catch (err) {
      if (createdOrderId && createdOrderNumber) {
        // Order exists — send user to success/tracking even if simulation flaked mid-way.
        await goToSuccess(createdOrderId, createdOrderNumber);
        return;
      }
      setPhase("failed");
      const message =
        err instanceof FirebaseError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Não foi possível criar o pedido.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function simulateFail() {
    setPhase("failed");
    setError(
      "Não foi possível confirmar. Nada foi cobrado. Você pode tentar de novo.",
    );
  }

  function resetFlow() {
    setPhase("choose");
    setError(null);
    setQuoteNotice(null);
  }

  if (!hasItems && phase !== "awaiting") {
    return (
      <Container>
        <EmptyState
          actionLabel="Voltar ao carrinho"
          description="Adicione itens e conclua o resumo antes de pagar."
          icon="cart-outline"
          onAction={() => router.replace("/(tabs)/cart" as Href)}
          title="Nada para pagar"
        />
      </Container>
    );
  }

  if (hasItems && !readyToPay && phase !== "awaiting") {
    return (
      <Container>
        <EmptyState
          actionLabel="Completar checkout"
          description="Faltam dados de destinatário, endereço ou agenda."
          icon="alert-circle-outline"
          onAction={() =>
            router.replace(checkoutRecoveryHref(cart?.checkout) as Href)
          }
          title="Checkout incompleto"
        />
      </Container>
    );
  }

  return (
    <Container scroll>
      <View style={styles.content}>
        <CheckoutStepper step={5} />
        <Typography style={styles.title} variant="title">
          Pagamento
        </Typography>
        <InlineNotice
          description="O valor é recalculado no servidor. PIX/cartão usam MockPaymentProvider até o gateway real."
          title="Pagamento via backend"
          tone="info"
        />

        {quoteNotice ? (
          <InlineNotice
            description={quoteNotice}
            title="Frete atualizado"
            tone="warning"
          />
        ) : null}

        <View style={styles.totalCard}>
          <Typography variant="caption">Total do pedido</Typography>
          <Typography style={styles.totalValue} variant="title">
            {totalLabel}
          </Typography>
        </View>

        {phase === "awaiting" ? (
          <View style={styles.awaitingCard}>
            <LoadingState label="Confirmando pedido…" />
            <InlineNotice
              description="Aguarde um instante. Em seguida você verá o número do pedido."
              title="Processando"
              tone="warning"
            />
          </View>
        ) : null}

        {phase === "choose" || phase === "failed" ? (
          <>
            <Typography style={styles.section} variant="subtitle">
              Forma de pagamento
            </Typography>
            <View style={styles.methodRow}>
              {(
                [
                  { id: "pix" as const, label: "PIX" },
                  { id: "card" as const, label: "Cartão" },
                ] as const
              ).map((option) => {
                const selected = method === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setMethod(option.id);
                      if (phase === "failed") resetFlow();
                    }}
                    style={({ pressed }) => [
                      styles.methodChip,
                      selected && styles.methodChipOn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Typography
                      style={[
                        styles.methodLabel,
                        selected && styles.methodLabelOn,
                      ]}
                      variant="body"
                    >
                      {option.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            {method === "pix" ? (
              <View style={styles.card}>
                <Typography style={styles.cardTitle} variant="caption">
                  PIX (exemplo)
                </Typography>
                <View style={styles.qrPlaceholder}>
                  <Typography style={styles.qrMark} variant="title">
                    QR
                  </Typography>
                  <Typography variant="caption">
                    Código de exemplo — não gera pagamento
                  </Typography>
                </View>
                <Typography selectable style={styles.pixCode} variant="caption">
                  {pixCode}
                </Typography>
                <Button
                  label="Copiar código PIX"
                  onPress={() => void copyPix()}
                  variant="outline"
                />
              </View>
            ) : (
              <View style={styles.card}>
                <Typography style={styles.cardTitle} variant="caption">
                  Cartão (mock)
                </Typography>
                <Typography variant="caption">
                  Número: 4111 **** **** 1111
                </Typography>
                <Typography variant="caption">
                  Validade: 12/30 · CVV: ***
                </Typography>
                <Typography variant="caption">
                  Dados ilustrativos — nenhuma cobrança é feita.
                </Typography>
              </View>
            )}

            {error ? (
              <InlineNotice
                description={error}
                title="Falha no pagamento"
                tone="error"
              />
            ) : null}

            <View style={styles.actions}>
              <Button
                label="Confirmar pedido"
                loading={busy}
                onPress={() => void simulateApprove()}
              />
              <Button
                label="Testar falha de pagamento"
                onPress={simulateFail}
                variant="outline"
              />
            </View>
          </>
        ) : null}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    marginBottom: 0,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  totalValue: {
    color: colors.primary,
  },
  awaitingCard: {
    gap: spacing.md,
  },
  section: {
    color: colors.ink,
    fontWeight: "700",
  },
  methodRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  methodChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  methodChipOn: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  methodLabel: {
    fontWeight: "700",
    textAlign: "center",
  },
  methodLabelOn: {
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardTitle: {
    fontWeight: "700",
  },
  qrPlaceholder: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    gap: spacing.xs,
    height: 160,
    justifyContent: "center",
    width: 160,
  },
  qrMark: {
    color: colors.primary,
  },
  pixCode: {
    color: colors.muted,
  },
  actions: {
    gap: spacing.md,
  },
});
