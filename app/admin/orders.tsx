import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import {
  markOrderPreparing,
  markOrderReady,
  reconcileDelivery,
  requestDelivery,
  retryDelivery,
} from "@/src/services/backend.service";
import { listAllOrders } from "@/src/services/order.service";
import { Order } from "@/src/types/order";
import { formatCurrency } from "@/src/utils/format";
import {
  deliveryStatusLabel,
  formatDateLabel,
  formatDateTimeLabel,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/src/utils/orderLabels";

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await listAllOrders();
      setOrders(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao listar pedidos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function runBackend(
    orderId: string,
    action: () => Promise<unknown>,
    label: string,
  ) {
    setBusyId(orderId);
    try {
      await action();
      await load();
    } catch (err) {
      Alert.alert(
        label,
        err instanceof Error ? err.message : "Falha na operação.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <Container>
        <LoadingState label="Carregando pedidos…" />
      </Container>
    );
  }

  return (
    <Container
      scroll
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <Typography variant="caption">ADMIN · PEDIDOS</Typography>
      <Typography style={styles.title} variant="title">
        Operação
      </Typography>
      <InlineNotice
        description="Somente callables do backend alteram status. Pagamento aprovado não cria Uber: preparar → pronto → solicitar entrega."
        title="Pagamento e entrega desacoplados"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          actionLabel="Voltar ao painel"
          description="Quando um cliente finalizar a compra, ele aparece nesta lista."
          icon="receipt-outline"
          onAction={() => router.replace("/admin" as Href)}
          title="Nenhum pedido por aqui"
        />
      ) : (
        <View style={styles.list}>
          {orders.map((order) => {
            const busy = busyId === order.id;
            const canRequest =
              (order.orderStatus === "ready_for_pickup" ||
                order.orderStatus === "ready_for_delivery") &&
              (order.deliveryCreationState === "not_started" ||
                order.deliveryCreationState === "failed" ||
                !order.deliveryCreationState);
            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.header}>
                  <Typography style={styles.orderNumber} variant="body">
                    {order.orderNumber}
                  </Typography>
                  <View style={styles.badge}>
                    <Typography style={styles.badgeLabel} variant="caption">
                      {orderStatusLabel(order.orderStatus)}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption">
                  Cliente: {order.customerName || order.customerEmail}
                </Typography>
                <Typography variant="caption">
                  Pagamento: {paymentStatusLabel(order.paymentStatus)} ·{" "}
                  {paymentMethodLabel(order.paymentMethod)}
                  {order.payment?.provider
                    ? ` · ${order.payment.provider}`
                    : ""}
                </Typography>
                <Typography variant="caption">
                  Entrega: {deliveryStatusLabel(order.deliveryStatus)}
                  {order.delivery?.externalDeliveryId
                    ? ` · ${order.delivery.externalDeliveryId}`
                    : ""}
                </Typography>
                {order.deliveryCreationState ? (
                  <Typography variant="caption">
                    Criação Uber: {order.deliveryCreationState}
                  </Typography>
                ) : null}
                {order.delivery?.lastError ? (
                  <InlineNotice
                    description={order.delivery.lastError}
                    title="Erro operacional"
                    tone="error"
                  />
                ) : null}
                <Typography variant="caption">
                  {formatDateTimeLabel(order.createdAt)} · Entrega{" "}
                  {formatDateLabel(order.deliveryDate)} ·{" "}
                  {order.deliveryPeriodLabel}
                </Typography>
                <Typography style={styles.total} variant="body">
                  {formatCurrency(order.total)}
                </Typography>
                <Pressable
                  onPress={() => router.push(`/order/${order.id}` as Href)}
                  style={({ pressed }) => pressed && { opacity: 0.85 }}
                >
                  <Typography style={styles.link} variant="caption">
                    Ver detalhe →
                  </Typography>
                </Pressable>

                {order.orderStatus === "paid" ? (
                  <Button
                    label="Marcar preparando"
                    loading={busy}
                    onPress={() =>
                      void runBackend(
                        order.id,
                        () => markOrderPreparing(order.id),
                        "Preparar",
                      )
                    }
                    variant="outline"
                  />
                ) : null}
                {order.orderStatus === "preparing" ? (
                  <Button
                    label="Marcar pronto para coleta"
                    loading={busy}
                    onPress={() =>
                      void runBackend(
                        order.id,
                        () => markOrderReady(order.id),
                        "Pronto",
                      )
                    }
                    variant="outline"
                  />
                ) : null}
                {canRequest ? (
                  <Button
                    label="Solicitar Uber Direct"
                    loading={busy}
                    onPress={() =>
                      void runBackend(
                        order.id,
                        () => requestDelivery(order.id),
                        "Solicitar entrega",
                      )
                    }
                  />
                ) : null}
                {order.deliveryCreationState === "failed" ? (
                  <Button
                    label="Retry entrega"
                    loading={busy}
                    onPress={() =>
                      void runBackend(
                        order.id,
                        () => retryDelivery(order.id),
                        "Retry",
                      )
                    }
                    variant="outline"
                  />
                ) : null}
                {order.deliveryCreationState === "uncertain" ||
                order.delivery?.externalDeliveryId ? (
                  <Button
                    label="Reconciliar entrega"
                    loading={busy}
                    onPress={() =>
                      void runBackend(
                        order.id,
                        () => reconcileDelivery(order.id),
                        "Reconciliar",
                      )
                    }
                    variant="secondary"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  orderNumber: {
    flex: 1,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: colors.primary,
    fontWeight: "700",
  },
  total: {
    color: colors.primary,
    fontWeight: "700",
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
});
