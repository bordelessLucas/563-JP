import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCart } from "@/src/contexts/CartContext";
import { listOrdersByCustomer } from "@/src/services/order.service";
import { Order } from "@/src/types/order";
import { formatCurrency } from "@/src/utils/format";
import {
  formatDateLabel,
  formatDateTimeLabel,
  orderStatusLabel,
} from "@/src/utils/orderLabels";

export function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const next = await listOrdersByCustomer(user.uid);
      setOrders(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar pedidos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && orders.length === 0 && !error) {
    return (
      <Container>
        <Typography variant="caption">PEDIDOS</Typography>
        <Typography style={styles.title} variant="title">
          Acompanhe suas compras
        </Typography>
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
      <Typography variant="caption">PEDIDOS</Typography>
      <Typography style={styles.title} variant="title">
        Acompanhe suas compras
      </Typography>

      {loading ? (
        <LoadingState label="Carregando pedidos…" />
      ) : null}

      {!loading && error ? (
        <View style={styles.notice}>
          <InlineNotice
            description={error}
            title="Erro ao carregar"
            tone="error"
          />
          <View style={styles.retry}>
            <Button
              label="Tentar de novo"
              onPress={() => {
                setLoading(true);
                void load();
              }}
              variant="outline"
            />
          </View>
        </View>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <EmptyState
          actionLabel={itemCount > 0 ? "Ir ao carrinho" : "Explorar catálogo"}
          description={
            itemCount > 0
              ? "Você já tem itens prontos. Continue o checkout."
              : "Quando houver pedidos confirmados, o status aparecerá aqui."
          }
          icon="receipt-outline"
          onAction={() =>
            router.push(
              (itemCount > 0 ? "/(tabs)/cart" : "/(tabs)/catalog") as Href,
            )
          }
          title="Nenhum pedido ainda"
        />
      ) : null}

      {!loading && orders.length > 0 ? (
        <View style={styles.list}>
          {orders.map((order) => {
            const firstItem = order.items[0];
            const itemSummary = firstItem
              ? order.items.length > 1
                ? `${firstItem.productName} · ${order.items.length} itens`
                : firstItem.productName
              : "Pedido sem itens";
            const thumb = firstItem?.productImage;

            return (
              <Pressable
                key={order.id}
                accessibilityRole="button"
                onPress={() => router.push(`/order/${order.id}` as Href)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardRow}>
                  {thumb ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      source={{ uri: thumb }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]} />
                  )}
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Typography style={styles.orderNumber} variant="body">
                        {order.orderNumber}
                      </Typography>
                      <View style={styles.badge}>
                        <Typography style={styles.badgeLabel} variant="caption">
                          {orderStatusLabel(order.orderStatus)}
                        </Typography>
                      </View>
                    </View>
                    <Typography numberOfLines={1} variant="caption">
                      {itemSummary}
                    </Typography>
                    <Typography variant="caption">
                      {formatDateTimeLabel(order.createdAt)}
                    </Typography>
                    <Typography variant="caption">
                      Entrega {formatDateLabel(order.deliveryDate)} ·{" "}
                      {order.deliveryPeriodLabel}
                    </Typography>
                    <Typography style={styles.total} variant="body">
                      {formatCurrency(order.total)}
                    </Typography>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  notice: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  retry: {
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumb: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    height: 56,
    width: 56,
  },
  thumbFallback: {
    backgroundColor: colors.softAccent,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
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
    marginTop: spacing.xs,
  },
});
