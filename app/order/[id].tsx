import { Ionicons } from "@expo/vector-icons";
import {
  Href,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { OrderTimeline } from "@/src/components/OrderTimeline";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { getOrderById } from "@/src/services/order.service";
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

export default function OrderDetailScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const ordersHome = (isAdmin ? "/admin/orders" : "/(tabs)/orders") as Href;
  const shopHome = (isAdmin ? "/admin" : "/(tabs)") as Href;

  const leaveToOrders = useCallback(() => {
    router.replace(ordersHome);
  }, [ordersHome, router]);

  const leaveToHome = useCallback(() => {
    router.replace(shopHome);
  }, [router, shopHome]);

  const load = useCallback(
    async (soft = false) => {
      if (!id) return;
      setError(null);
      if (soft) setRefreshing(true);
      else setLoading(true);
      try {
        const next = await getOrderById(id);
        setOrder(next);
        if (!next) setError("Pedido não encontrado.");
        hasLoadedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar o pedido.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current);
    }, [load]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: order?.orderNumber ?? "Pedido",
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              accessibilityLabel="Voltar aos pedidos"
              accessibilityRole="button"
              hitSlop={8}
              onPress={leaveToOrders}
              style={styles.headerBack}
            >
              <Ionicons color={colors.primary} name="chevron-back" size={22} />
              <Typography style={styles.headerBackLabel} variant="caption">
                Pedidos
              </Typography>
            </Pressable>
          ),
        }}
      />
      <Container
        scroll
        refreshing={refreshing}
        onRefresh={() => void load(true)}
      >
        {loading ? <LoadingState label="Carregando pedido…" /> : null}

        {!loading && error ? (
          <View style={styles.content}>
            <InlineNotice
              description={error}
              title="Não foi possível abrir"
              tone="error"
            />
            <Button
              label={isAdmin ? "Voltar aos pedidos admin" : "Voltar aos pedidos"}
              onPress={leaveToOrders}
            />
            <Button
              label={isAdmin ? "Ir ao painel" : "Ir à home"}
              onPress={leaveToHome}
              variant="outline"
            />
          </View>
        ) : null}

        {!loading && order ? (
          <View style={styles.content}>
            <Typography variant="caption">ACOMPANHAMENTO</Typography>
            <Typography style={styles.title} variant="title">
              {order.orderNumber}
            </Typography>
            <Typography variant="caption">
              Criado em {formatDateTimeLabel(order.createdAt)}
            </Typography>

            <View style={styles.card}>
              <Typography style={styles.cardTitle} variant="caption">
                Status
              </Typography>
              <Typography style={styles.value} variant="body">
                {orderStatusLabel(order.orderStatus)}
              </Typography>
              <Typography variant="caption">
                Pagamento: {paymentStatusLabel(order.paymentStatus)} ·{" "}
                {paymentMethodLabel(order.paymentMethod)}
              </Typography>
              <Typography variant="caption">
                Entrega: {deliveryStatusLabel(order.deliveryStatus)}
              </Typography>
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle} variant="caption">
                Timeline da entrega
              </Typography>
              <OrderTimeline orderStatus={order.orderStatus} />
              {order.delivery?.trackingUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    void Linking.openURL(order.delivery!.trackingUrl!);
                  }}
                  style={styles.trackingHit}
                >
                  <Typography style={styles.link} variant="caption">
                    Abrir rastreio
                  </Typography>
                  <Typography selectable variant="caption">
                    {order.delivery.trackingUrl}
                  </Typography>
                </Pressable>
              ) : null}
              {order.delivery?.courier?.name ? (
                <Typography variant="caption">
                  Entregador: {order.delivery.courier.name}
                  {order.delivery.courier.phone
                    ? ` · ${order.delivery.courier.phone}`
                    : ""}
                </Typography>
              ) : null}
              <Typography variant="caption">
                Puxe para atualizar após o admin avançar o status.
              </Typography>
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle} variant="caption">
                Destinatário
              </Typography>
              <Typography style={styles.value} variant="body">
                {order.recipient.name}
              </Typography>
              <Typography variant="caption">{order.recipient.phone}</Typography>
              {order.recipient.notes ? (
                <Typography variant="caption">
                  Obs.: {order.recipient.notes}
                </Typography>
              ) : null}
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle} variant="caption">
                Entrega
              </Typography>
              <Typography style={styles.value} variant="body">
                {formatDateLabel(order.deliveryDate)} · {order.deliveryPeriodLabel}
              </Typography>
              <Typography variant="caption">
                {order.deliveryAddress.street}, {order.deliveryAddress.number}
                {order.deliveryAddress.complement
                  ? ` · ${order.deliveryAddress.complement}`
                  : ""}
              </Typography>
              <Typography variant="caption">
                {order.deliveryAddress.neighborhood} ·{" "}
                {order.deliveryAddress.city}/{order.deliveryAddress.state}
              </Typography>
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle} variant="caption">
                Itens
              </Typography>
              {order.items.map((item, index) => (
                <View
                  key={`${item.productId}-${index}`}
                  style={styles.itemRow}
                >
                  <View style={styles.itemCopy}>
                    <Typography style={styles.value} variant="body">
                      {item.quantity}x {item.productName}
                    </Typography>
                    {item.message ? (
                      <Typography variant="caption">
                        “{item.message}”
                      </Typography>
                    ) : null}
                  </View>
                  <Typography variant="caption">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </Typography>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Typography style={styles.value} variant="subtitle">
                  Total
                </Typography>
                <Typography style={styles.total} variant="subtitle">
                  {formatCurrency(order.total)}
                </Typography>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                label="Atualizar status"
                onPress={() => void load(true)}
                variant="outline"
              />
              <Button
                label={isAdmin ? "Voltar aos pedidos admin" : "Voltar aos pedidos"}
                onPress={leaveToOrders}
              />
              <Button
                label={isAdmin ? "Ir ao painel" : "Continuar comprando"}
                onPress={leaveToHome}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  headerBack: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    minHeight: 44,
    paddingRight: spacing.sm,
  },
  headerBackLabel: {
    color: colors.primary,
    fontWeight: "700",
  },
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
  trackingHit: {
    gap: spacing.xs,
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  totalRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  total: {
    color: colors.primary,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
});
