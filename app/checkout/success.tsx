import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { getOrderById } from "@/src/services/order.service";
import { Order } from "@/src/types/order";
import { formatCurrency } from "@/src/utils/format";
import {
  formatDateLabel,
  paymentMethodLabel,
} from "@/src/utils/orderLabels";

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { orderId, orderNumber } = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  const displayNumber = order?.orderNumber
    ?? (typeof orderNumber === "string"
      ? decodeURIComponent(orderNumber)
      : "—");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    void getOrderById(orderId)
      .then((next) => setOrder(next))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Container scroll>
      <View style={styles.content}>
        <Typography variant="caption">PEDIDO CRIADO</Typography>
        <Typography style={styles.title} variant="title">
          Pagamento aprovado
        </Typography>
        <InlineNotice
          description="Seu pedido foi gravado. Acompanhe o status na aba Pedidos — a entrega avança de forma simulada pelo admin."
          title="Tudo certo"
          tone="success"
        />

        <View style={styles.card}>
          <Typography variant="caption">Número do pedido</Typography>
          <Typography style={styles.number} variant="subtitle">
            {displayNumber}
          </Typography>
        </View>

        {loading ? <LoadingState label="Carregando resumo…" /> : null}

        {!loading && order ? (
          <View style={styles.card}>
            <Typography style={styles.cardTitle} variant="caption">
              Resumo
            </Typography>
            <Typography variant="caption">
              {order.items.length}{" "}
              {order.items.length === 1 ? "item" : "itens"} ·{" "}
              {paymentMethodLabel(order.paymentMethod)}
            </Typography>
            <Typography variant="caption">
              Entrega {formatDateLabel(order.deliveryDate)} ·{" "}
              {order.deliveryPeriodLabel}
            </Typography>
            <Typography style={styles.total} variant="body">
              {formatCurrency(order.total)}
            </Typography>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            disabled={!orderId}
            label="Acompanhar pedido"
            onPress={() => router.replace(`/order/${orderId}` as Href)}
          />
          <Button
            label="Ver meus pedidos"
            onPress={() => router.replace("/(tabs)/orders" as Href)}
            variant="outline"
          />
          <Button
            label="Voltar ao início"
            onPress={() => router.replace("/(tabs)" as Href)}
            variant="secondary"
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
  },
  number: {
    color: colors.primary,
    fontWeight: "700",
  },
  total: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
});
