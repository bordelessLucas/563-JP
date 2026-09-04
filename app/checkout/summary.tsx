import { Href, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import { formatCurrency } from "@/src/utils/format";

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default function CheckoutSummaryScreen() {
  const router = useRouter();
  const { cart } = useCart();
  const checkout = cart?.checkout;
  const address = checkout?.address;
  const recipient = checkout?.recipient;

  const incomplete =
    !cart ||
    cart.items.length === 0 ||
    !recipient?.name ||
    !address?.street ||
    !checkout?.deliveryDate ||
    !checkout.deliveryPeriodLabel;

  return (
    <Container scroll>
      <View style={styles.content}>
        <Typography variant="caption">ETAPA 4 DE 5</Typography>
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
            description="Na próxima etapa você escolhe PIX ou cartão. Nenhum valor real é cobrado nesta demo."
            title="Tudo certo para pagar"
            tone="success"
          />
        )}

        <View style={styles.card}>
          <Typography style={styles.cardTitle} variant="caption">
            Entregar para
          </Typography>
          <Typography style={styles.value} variant="body">
            {recipient?.name || "—"}
          </Typography>
          <Typography variant="caption">{recipient?.phone || "—"}</Typography>
          {recipient?.notes ? (
            <Typography variant="caption">Obs.: {recipient.notes}</Typography>
          ) : null}
        </View>

        <View style={styles.card}>
          <Typography style={styles.cardTitle} variant="caption">
            Endereço
          </Typography>
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
          <Typography style={styles.cardTitle} variant="caption">
            Agenda
          </Typography>
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
            <Typography variant="caption">Entrega</Typography>
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
            disabled={incomplete}
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: spacing.xs,
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
