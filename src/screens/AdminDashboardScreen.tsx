import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Container } from "@/src/components/Container";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { listAllOrders } from "@/src/services/order.service";
import { Order } from "@/src/types/order";

type DashboardModule = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  href?: Href;
  status: "live" | "soon";
};

const modules: DashboardModule[] = [
  {
    icon: "receipt-outline",
    title: "Pedidos",
    description: "Listagem, detalhes e avanço manual de status.",
    href: "/admin/orders" as Href,
    status: "live",
  },
  {
    icon: "flower-outline",
    title: "Produtos",
    description: "Criar, ativar/desativar e listar produtos.",
    href: "/admin/products" as Href,
    status: "live",
  },
  {
    icon: "pricetags-outline",
    title: "Categorias",
    description: "Organização do catálogo e ordenação.",
    href: "/admin/categories" as Href,
    status: "live",
  },
  {
    icon: "images-outline",
    title: "Banners",
    description: "Campanhas e destinos (service pronto).",
    status: "soon",
  },
  {
    icon: "settings-outline",
    title: "Configurações",
    description: "Períodos, taxas e região de entrega.",
    status: "soon",
  },
];

function buildStats(orders: Order[]) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = orders.filter((order) =>
    order.createdAt?.startsWith(today),
  ).length;
  const preparing = orders.filter((order) =>
    ["paid", "preparing", "ready_for_delivery"].includes(order.orderStatus),
  ).length;
  const delivering = orders.filter(
    (order) => order.orderStatus === "out_for_delivery",
  ).length;
  const done = orders.filter((order) => order.orderStatus === "delivered").length;

  return [
    { label: "Pedidos do dia", value: String(todayCount) },
    { label: "Em preparação", value: String(preparing) },
    { label: "Em entrega", value: String(delivering) },
    { label: "Concluídos", value: String(done) },
  ];
}

export function AdminDashboardScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setOrders(await listAllOrders());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const stats = buildStats(orders);

  return (
    <Container scroll>
      <View style={styles.header}>
        <View>
          <Typography variant="caption">PAINEL ADMINISTRATIVO</Typography>
          <Typography variant="title">Olá, {profile?.name ?? "Admin"}</Typography>
          <Typography variant="caption">{profile?.email}</Typography>
        </View>
        <Pressable
          accessibilityLabel="Sair"
          onPress={logout}
          style={styles.logoutButton}
        >
          <Ionicons color={colors.primary} name="log-out-outline" size={22} />
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Typography style={styles.bannerEyebrow} variant="caption">
          OPERAÇÃO · DEMO
        </Typography>
        <Typography style={styles.bannerTitle} variant="subtitle">
          Contadores a partir dos pedidos reais. Use Pedidos para avançar o
          status na demonstração.
        </Typography>
      </View>

      <Typography style={styles.sectionTitle} variant="subtitle">
        Resumo
      </Typography>
      {loading ? (
        <LoadingState label="Atualizando…" />
      ) : (
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Typography style={styles.statValue} variant="title">
                {stat.value}
              </Typography>
              <Typography variant="caption">{stat.label}</Typography>
            </View>
          ))}
        </View>
      )}

      <Typography style={styles.sectionTitle} variant="subtitle">
        Módulos
      </Typography>
      <View style={styles.moduleList}>
        {modules.map((module) => {
          const content = (
            <>
              <View style={styles.moduleIcon}>
                <Ionicons color={colors.primary} name={module.icon} size={22} />
              </View>
              <View style={styles.moduleCopy}>
                <View style={styles.moduleTitleRow}>
                  <Typography style={styles.moduleTitle} variant="body">
                    {module.title}
                  </Typography>
                  <View
                    style={[
                      styles.badge,
                      module.status === "live"
                        ? styles.badgeLive
                        : styles.badgeSoon,
                    ]}
                  >
                    <Typography style={styles.badgeLabel} variant="caption">
                      {module.status === "live" ? "ATIVO" : "EM BREVE"}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption">{module.description}</Typography>
              </View>
            </>
          );

          if (module.href) {
            return (
              <Pressable
                key={module.title}
                onPress={() => router.push(module.href!)}
                style={styles.moduleCard}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View key={module.title} style={styles.moduleCard}>
              {content}
            </View>
          );
        })}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  bannerEyebrow: {
    color: colors.softAccent,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: colors.white,
  },
  sectionTitle: {
    color: colors.ink,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    width: "48%",
  },
  statValue: {
    color: colors.primary,
  },
  moduleList: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  moduleCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  moduleIcon: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  moduleCopy: {
    flex: 1,
    gap: 4,
  },
  moduleTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  moduleTitle: {
    flex: 1,
    fontWeight: "700",
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeLive: {
    backgroundColor: colors.softAccent,
  },
  badgeSoon: {
    backgroundColor: colors.secondary,
  },
  badgeLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
});
