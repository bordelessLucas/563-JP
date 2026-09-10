import { Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { CheckoutStepper } from "@/src/components/CheckoutStepper";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import { createDeliveryQuote } from "@/src/services/backend.service";
import { formatCurrency } from "@/src/utils/format";

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default function CheckoutSummaryScreen() {
  const router = useRouter();
  const { cart, refreshCart, saveCheckout } = useCart();
  const checkout = cart?.checkout;
  const address = checkout?.address;
  const recipient = checkout?.recipient;

  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);
  const [quoteNonce, setQuoteNonce] = useState(0);

  const incomplete =
    !cart ||
    cart.items.length === 0 ||
    !recipient?.name ||
    !address?.street ||
    !checkout?.deliveryDate ||
    !checkout.deliveryPeriodLabel;

  useEffect(() => {
    if (incomplete || !address || !checkout || !recipient) return;

    let active = true;
    const run = async () => {
      setQuoting(true);
      setQuoteError(null);
      try {
        const previousFee = cart.deliveryFee;
        const { quote } = await createDeliveryQuote({
          address,
          persistToCart: true,
        });
        if (!active) return;

        // Preserve server quote already written by the callable; draft save strips client fees.
        await saveCheckout({
          ...checkout,
          deliveryQuote: quote,
        });
        await refreshCart();

        const nextFee = quote.feeCents / 100;
        if (Math.abs(previousFee - nextFee) > 0.001) {
          setQuoteNotice(
            `Frete atualizado para ${formatCurrency(nextFee)}.`,
          );
        }
      } catch (err) {
        if (!active) return;
        setQuoteError(
          err instanceof Error
            ? err.message
            : "Não foi possível cotar a entrega.",
        );
      } finally {
        if (active) setQuoting(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
    // Only re-quote when address/schedule identity changes or user retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    incomplete,
    address?.cep,
    address?.street,
    address?.number,
    checkout?.deliveryDate,
    checkout?.deliveryPeriodId,
    quoteNonce,
  ]);

  return (
    <Container scroll>
      <View style={styles.content}>
        <CheckoutStepper step={4} />
        <Typography style={styles.title} variant="title">
          Revise antes de pagar
        </Typography>

        {incomplete ? (
          <InlineNotice
            description="Volte às etapas anteriores e complete destinatário, endereço e agenda."
            title="Resumo incompleto"
            tone="warning"
          />
        ) : (
          <InlineNotice
            description="Na próxima etapa você escolhe PIX ou cartão. O frete vem da cotação do backend."
            title="Tudo certo para pagar"
            tone="success"
          />
        )}

        {quoting ? <LoadingState label="Cotando entrega…" /> : null}
        {quoteError ? (
          <View style={styles.quoteErrorBlock}>
            <InlineNotice
              description={quoteError}
              title="Cotação indisponível"
              tone="error"
            />
            <Button
              label="Tentar cotar de novo"
              onPress={() => setQuoteNonce((n) => n + 1)}
              variant="outline"
            />
          </View>
        ) : null}
        {quoteNotice ? (
          <InlineNotice
            description={quoteNotice}
            title="Frete atualizado"
            tone="info"
          />
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography style={styles.cardTitle} variant="caption">
              Entregar para
            </Typography>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/checkout/recipient" as Href)}
            >
              <Typography style={styles.editLink} variant="caption">
                Editar
              </Typography>
            </Pressable>
          </View>
          <Typography style={styles.value} variant="body">
            {recipient?.name || "—"}
          </Typography>
          <Typography variant="caption">{recipient?.phone || "—"}</Typography>
          {recipient?.notes ? (
            <Typography variant="caption">Obs.: {recipient.notes}</Typography>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography style={styles.cardTitle} variant="caption">
              Endereço
            </Typography>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/checkout/address" as Href)}
            >
              <Typography style={styles.editLink} variant="caption">
                Editar
              </Typography>
            </Pressable>
          </View>
          <Typography style={styles.value} variant="body">
            {address
              ? `${address.street}, ${address.number}${
                  address.complement ? ` · ${address.complement}` : ""
                }`
              : "—"}
          </Typography>
          <Typography variant="caption">
            {address
              ? `${address.neighborhood} · ${address.city}/${address.state} · CEP ${address.cep}`
              : "—"}
          </Typography>
          {address?.reference ? (
            <Typography variant="caption">Ref.: {address.reference}</Typography>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typography style={styles.cardTitle} variant="caption">
              Agenda
            </Typography>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/checkout/schedule" as Href)}
            >
              <Typography style={styles.editLink} variant="caption">
                Editar
              </Typography>
            </Pressable>
          </View>
          <Typography style={styles.value} variant="body">
            {checkout?.deliveryDate
              ? formatDateLabel(checkout.deliveryDate)
              : "—"}
          </Typography>
          <Typography variant="caption">
            Período: {checkout?.deliveryPeriodLabel || "—"}
          </Typography>
        </View>

        <View style={styles.card}>
          <Typography style={styles.cardTitle} variant="caption">
            Itens
          </Typography>
          <View style={styles.itemsList}>
            {cart?.items.map((item) => (
              <View key={item.productId} style={styles.itemRow}>
                <View style={styles.itemCopy}>
                  <Typography style={styles.value} variant="body">
                    {item.quantity}x {item.productName}
                  </Typography>
                  {item.message ? (
                    <Typography variant="caption">“{item.message}”</Typography>
                  ) : null}
                </View>
                <Typography variant="caption">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Typography variant="caption">Subtotal</Typography>
            <Typography variant="body">
              {formatCurrency(cart?.subtotal ?? 0)}
            </Typography>
          </View>
          <View style={styles.totalRow}>
            <Typography variant="caption">Entrega (cotada)</Typography>
            <Typography variant="body">
              {formatCurrency(cart?.deliveryFee ?? 0)}
            </Typography>
          </View>
          <View style={styles.totalRow}>
            <Typography style={styles.totalLabel} variant="subtitle">
              Total
            </Typography>
            <Typography style={styles.totalValue} variant="subtitle">
              {formatCurrency(cart?.total ?? 0)}
            </Typography>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            disabled={incomplete || quoting || Boolean(quoteError)}
            label="Ir para pagamento"
            onPress={() => router.push("/checkout/payment" as Href)}
          />
          <Button
            label="Voltar ao carrinho"
            onPress={() => router.replace("/(tabs)/cart")}
            variant="outline"
          />
        </View>
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
  quoteErrorBlock: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontWeight: "700",
  },
  editLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  value: {
    fontWeight: "700",
  },
  itemsList: {
    gap: spacing.md,
  },
  itemRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  totals: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  totalValue: {
    color: colors.primary,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
