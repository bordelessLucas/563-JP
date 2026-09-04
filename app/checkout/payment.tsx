import * as Clipboard from "expo-clipboard";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCart } from "@/src/contexts/CartContext";
import { createOrderFromCart } from "@/src/services/order.service";
import { PaymentMethod } from "@/src/types/order";
import { formatCurrency } from "@/src/utils/format";

type PaymentPhase = "choose" | "awaiting" | "failed";

const MOCK_PIX_CODE =
  "00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-42661417400052040000530398654041.005802BR5925JP FLORES DEMO MVP6009SAO PAULO62070503***6304ABCD";

export default function CheckoutPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string }>();
  const { user, profile } = useAuth();
  const { cart, emptyCart } = useCart();

  const initialMethod: PaymentMethod =
    params.method === "card" ? "card" : "pix";

  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [phase, setPhase] = useState<PaymentPhase>("choose");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLabel = useMemo(
    () => formatCurrency(cart?.total ?? 0),
    [cart?.total],
  );

  const hasItems = Boolean(cart && cart.items.length > 0);

  async function copyPix() {
    await Clipboard.setStringAsync(MOCK_PIX_CODE);
    Alert.alert("Copiado", "Código PIX fictício copiado.");
  }

  async function simulateApprove() {
    if (!user || !cart || cart.items.length === 0) return;
    setBusy(true);
    setError(null);
    setPhase("awaiting");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const order = await createOrderFromCart({
        customerId: user.uid,
        customerName: profile?.name ?? user.displayName ?? "Cliente",
        customerEmail: profile?.email ?? user.email ?? "",
        cart,
        paymentMethod: method,
      });
      await emptyCart();
      router.replace(
        `/checkout/success?orderId=${order.id}&orderNumber=${encodeURIComponent(order.orderNumber)}` as Href,
      );
    } catch (err) {
      setPhase("failed");
      setError(
        err instanceof Error ? err.message : "Não foi possível criar o pedido.",
      );
    } finally {
      setBusy(false);
    }
  }

  function simulateFail() {
    setPhase("failed");
    setError("Pagamento simulado recusado. Tente novamente.");
  }

  function resetFlow() {
    setPhase("choose");
    setError(null);
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

  return (
    <Container scroll>
      <View style={styles.content}>
        <Typography variant="caption">ETAPA 5 DE 5 · PAGAMENTO SIMULADO</Typography>
        <Typography style={styles.title} variant="title">
          Finalize sem cobrança real
        </Typography>
        <InlineNotice
          description="PIX e cartão são fictícios. Ao aprovar, o pedido é gravado para acompanhamento e para o admin."
          title="Ambiente de demonstração"
          tone="info"
        />

        <View style={styles.totalCard}>
          <Typography variant="caption">Total a pagar</Typography>
          <Typography style={styles.totalValue} variant="title">
            {totalLabel}
          </Typography>
        </View>

        {phase === "awaiting" ? (
          <View style={styles.awaitingCard}>
            <LoadingState label="Confirmando pagamento simulado…" />
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
                  QR / Copia e cola (fictício)
                </Typography>
                <View style={styles.qrPlaceholder}>
                  <Typography style={styles.qrMark} variant="title">
                    QR
                  </Typography>
                  <Typography variant="caption">Mock · não processa</Typography>
                </View>
                <Typography
                  selectable
                  style={styles.pixCode}
                  variant="caption"
                >
                  {MOCK_PIX_CODE}
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
                label="Confirmar pagamento"
                loading={busy}
                onPress={() => void simulateApprove()}
              />
              <Button
                label="Simular falha"
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
