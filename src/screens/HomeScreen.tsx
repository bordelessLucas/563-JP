import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { LoadingState } from "@/src/components/LoadingState";
import { ProductCard } from "@/src/components/ProductCard";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { listActiveBanners } from "@/src/services/banner.service";
import { listActiveCategories } from "@/src/services/category.service";
import { listFeaturedProducts } from "@/src/services/product.service";
import { Banner, Category, Product } from "@/src/types/catalog";
import { greetingForNow } from "@/src/utils/format";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - GRID_GAP) / 2;

export function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [nextBanners, nextCategories, nextFeatured] = await Promise.all([
        listActiveBanners(),
        listActiveCategories(),
        listFeaturedProducts(),
      ]);
      setBanners(nextBanners);
      setCategories(nextCategories);
      setFeatured(nextFeatured);
    } catch {
      setError("Não foi possível carregar a vitrine. Puxe para atualizar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const banner = banners[0];
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const firstName = profile?.name?.split(" ")[0] ?? "você";

  const openBanner = () => {
    if (!banner) return;
    if (banner.destination.type === "category") {
      router.push({
        pathname: "/(tabs)/catalog",
        params: { categoryId: banner.destination.id },
      });
      return;
    }
    if (banner.destination.type === "product") {
      router.push(`/product/${banner.destination.id}`);
    }
  };

  return (
    <Container onRefresh={() => void load(true)} refreshing={refreshing} scroll>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Typography variant="caption">FLORA & PRESENTES</Typography>
          <Typography variant="title">
            {greetingForNow()}, {firstName}
          </Typography>
          <Typography variant="caption">
            Escolha flores e presentes com poucos toques.
          </Typography>
        </View>
        <Pressable
          accessibilityLabel="Abrir perfil"
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.profileButton}
        >
          <Ionicons color={colors.primary} name="person-outline" size={21} />
        </Pressable>
      </View>

      {loading ? <LoadingState label="Montando sua vitrine..." /> : null}

      {!loading && error ? (
        <EmptyState
          actionLabel="Tentar novamente"
          description={error}
          icon="alert-circle-outline"
          onAction={() => void load()}
          title="Vitrine indisponível"
        />
      ) : null}

      {!loading && !error ? (
        <>
          {banner ? (
            <Pressable
              accessibilityHint="Abre a categoria ou produto em destaque"
              accessibilityLabel={`Banner ${banner.title}`}
              accessibilityRole="button"
              onPress={openBanner}
              style={styles.banner}
            >
              <ImageBackground
                imageStyle={styles.bannerImage}
                source={{ uri: banner.image }}
                style={styles.bannerBackground}
              >
                <View style={styles.bannerOverlay}>
                  <Typography style={styles.bannerEyebrow} variant="caption">
                    DESTAQUE
                  </Typography>
                  <Typography style={styles.bannerTitle} variant="title">
                    {banner.title}
                  </Typography>
                  <View style={styles.bannerCta}>
                    <Typography style={styles.bannerCtaLabel} variant="caption">
                      Explorar agora
                    </Typography>
                    <Ionicons color={colors.primary} name="arrow-forward" size={14} />
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          ) : null}

          <View style={styles.sectionHeader}>
            <Typography style={styles.sectionTitle} variant="subtitle">
              Categorias
            </Typography>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/(tabs)/catalog")}
            >
              <Typography style={styles.link} variant="caption">
                Ver catálogo
              </Typography>
            </Pressable>
          </View>

          <View style={styles.categoryShell}>
            <ScrollView
              contentContainerStyle={styles.categoryContent}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
            >
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityLabel={`Categoria ${category.name}`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/catalog",
                      params: { categoryId: category.id },
                    })
                  }
                  style={styles.category}
                >
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                  <Typography numberOfLines={1} style={styles.categoryLabel} variant="caption">
                    {category.name}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <Typography style={styles.sectionTitle} variant="subtitle">
              Destaques para você
            </Typography>
          </View>

          {featured.length === 0 ? (
            <EmptyState
              actionLabel="Ver catálogo"
              description="Assim que houver novidades, elas aparecem aqui."
              onAction={() => router.push("/(tabs)/catalog")}
              title="Nenhum destaque no momento"
            />
          ) : (
            <View style={styles.grid}>
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  categoryName={categoryMap.get(product.categoryId)}
                  onPress={() => router.push(`/product/${product.id}`)}
                  product={product}
                  width={CARD_WIDTH}
                />
              ))}
            </View>
          )}
        </>
      ) : null}
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
  headerCopy: {
    flex: 1,
    gap: 4,
    paddingRight: spacing.md,
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  banner: {
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  bannerBackground: {
    minHeight: 200,
  },
  bannerImage: {
    borderRadius: radius.lg,
  },
  bannerOverlay: {
    backgroundColor: "rgba(28, 43, 38, 0.48)",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    minHeight: 200,
    padding: spacing.lg,
  },
  bannerEyebrow: {
    color: colors.softAccent,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: colors.white,
    maxWidth: "90%",
  },
  bannerCta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerCtaLabel: {
    color: colors.primary,
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontWeight: "700",
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
  categoryShell: {
    height: 112,
    marginBottom: spacing.xl,
    marginHorizontal: -CONTENT_PADDING,
  },
  categoryContent: {
    gap: spacing.sm,
    paddingHorizontal: CONTENT_PADDING,
  },
  category: {
    alignItems: "center",
    flexShrink: 0,
    gap: spacing.xs,
    width: 84,
  },
  categoryImage: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    height: 84,
    width: 84,
  },
  categoryLabel: {
    color: colors.ink,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingBottom: spacing.xl,
    width: "100%",
  },
});
