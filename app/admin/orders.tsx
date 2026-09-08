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
import { useAuth } from "@/src/contexts/AuthContext";
import {
  advanceOrderStatus,
  listAllOrders,
  nextOrderStatus,
} from "@/src/services/order.service";
import { Order } from "@/src/types/order";
import { formatCurrency } from "@/src/utils/format";
import {
  formatDateLabel,
  formatDateTimeLabel,
  orderStatusLabel,
  paymentMethodLabel,
} from "@/src/utils/orderLabels";

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
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

  function confirmAdvance(order: Order) {
    const next = nextOrderStatus(order.orderStatus);
    if (!next || !user) return;

    Alert.alert(
      "Avançar status",
      `De “${orderStatusLabel(order.orderStatus)}” para “${orderStatusLabel(next)}”?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => void runAdvance(order.id, next),
        },
      ],
    );
  }

  async function runAdvance(orderId: string, next: NonNullable<ReturnType<typeof nextOrderStatus>>) {
    if (!user) return;
    setBusyId(orderId);
    try {
      await advanceOrderStatus(orderId, next, user.uid);
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Não foi possível atualizar.",
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
        Operação da demo
      </Typography>
      <InlineNotice
        description="Avance o status manualmente para a timeline do cliente. Sem GPS e sem API de entrega."
        title="Controle mock de logística"
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
            const next = nextOrderStatus(order.orderStatus);
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
                  {formatDateTimeLabel(order.createdAt)} ·{" "}
                  {paymentMethodLabel(order.paymentMethod)}
                </Typography>
                <Typography variant="caption">
                  Entrega {formatDateLabel(order.deliveryDate)} ·{" "}
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
                {next ? (
                  <Button
                    label={`Avançar → ${orderStatusLabel(next)}`}
                    loading={busyId === order.id}
                    onPress={() => confirmAdvance(order)}
                  />
                ) : (
                  <Typography variant="caption">
                    Fluxo concluído ou fora da sequência demo.
                  </Typography>
                )}
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
