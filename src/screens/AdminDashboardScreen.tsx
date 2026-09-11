import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
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
    description: "Liste pedidos e avance o status da entrega.",
    href: "/admin/orders" as Href,
    status: "live",
  },
  {
    icon: "flower-outline",
    title: "Produtos",
    description: "Preço, estoque, destaque e ativação do catálogo.",
    href: "/admin/products" as Href,
    status: "live",
  },
  {
    icon: "pricetags-outline",
    title: "Categorias",
    description: "Nome, ordem, imagem e ativação das seções.",
    href: "/admin/categories" as Href,
    status: "live",
  },
  {
    icon: "images-outline",
    title: "Promoções",
    description: "Lance campanhas e o modal prioritário da vitrine.",
    href: "/admin/promotions" as Href,
    status: "live",
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
  const done = orders.filter(
    (order) => order.orderStatus === "delivered",
  ).length;

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await listAllOrders());
    } catch (err) {
      setOrders([]);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o painel.",
      );
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
          <Typography variant="title">
            Olá, {profile?.name ?? "Admin"}
          </Typography>
          <Typography variant="caption">{profile?.email}</Typography>
        </View>
        <Pressable
          accessibilityLabel="Sair"
          accessibilityRole="button"
          onPress={() => {
            Alert.alert("Sair", "Sair da conta de gestão?", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Sair",
                style: "destructive",
                onPress: () => {
                  void logout();
                },
              },
            ]);
          }}
          style={styles.logoutButton}
        >
          <Ionicons color={colors.primary} name="log-out-outline" size={22} />
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Typography style={styles.bannerEyebrow} variant="caption">
          OPERAÇÃO · DEMONSTRAÇÃO
        </Typography>
        <Typography style={styles.bannerTitle} variant="subtitle">
          Contadores a partir dos pedidos. Use Pedidos para avançar o status na
          demonstração.
        </Typography>
      </View>

      <Typography style={styles.sectionTitle} variant="subtitle">
        Resumo
      </Typography>
      {loading ? <LoadingState label="Carregando painel…" /> : null}
      {!loading && error ? (
        <View style={styles.errorBlock}>
          <InlineNotice
            description="Os números podem estar desatualizados. Verifique a conexão e tente de novo."
            title="Não foi possível carregar o painel"
            tone="error"
          />
          <Button
            label="Tentar novamente"
            onPress={() => {
              setLoading(true);
              void load();
            }}
            variant="outline"
          />
        </View>
      ) : null}
      {!loading && !error ? (
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
      ) : null}

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
                    <Typography
                      style={[
                        styles.badgeLabel,
                        module.status === "live" && styles.badgeLabelLive,
                      ]}
                      variant="caption"
                    >
                      {module.status === "live" ? "Disponível" : "Em breve"}
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
                accessibilityRole="button"
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

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    logoutButton: {
      alignItems: "center",
      backgroundColor: palette.secondary,
      borderRadius: radius.xl,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    banner: {
      backgroundColor: palette.brandBlack,
      borderRadius: radius.lg,
      gap: spacing.sm,
      marginBottom: spacing.xl,
      padding: spacing.lg,
    },
    bannerEyebrow: {
      color: palette.primary,
      fontWeight: "700",
      letterSpacing: 1,
    },
    bannerTitle: {
      color: palette.white,
    },
    sectionTitle: {
      color: palette.ink,
      fontWeight: "700",
      marginBottom: spacing.md,
    },
    errorBlock: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    statCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.md,
      width: "48%",
    },
    statValue: {
      color: palette.primary,
    },
    moduleList: {
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    moduleCard: {
      alignItems: "flex-start",
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md,
    },
    moduleIcon: {
      alignItems: "center",
      backgroundColor: palette.secondary,
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
      backgroundColor: palette.secondary,
    },
    badgeSoon: {
      backgroundColor: palette.secondary,
    },
    badgeLabel: {
      color: palette.ink,
      fontWeight: "700",
    },
    badgeLabelLive: {
      color: palette.success,
    },
  });
}
