import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
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
import { BrandMark } from "@/src/components/BrandMark";
import { ProductCard } from "@/src/components/ProductCard";
import { PromoModal } from "@/src/components/PromoModal";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { brand } from "@/src/constants/brand";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import {
  getActivePromoModal,
  listActiveHeroBanners,
  listHomePromotions,
} from "@/src/services/banner.service";
import { listActiveCategories } from "@/src/services/category.service";
import { listFeaturedProducts } from "@/src/services/product.service";
import { Banner, Category, Product } from "@/src/types/catalog";
import { greetingForNow } from "@/src/utils/format";
import {
  hasSeenPromoModal,
  markPromoModalSeen,
} from "@/src/utils/promoModalStorage";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - GRID_GAP) / 2;

const CATALOG_PROMO_HREF = {
  pathname: "/(tabs)/catalog",
  params: { filter: "promo" },
} as const;

export function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroBanners, setHeroBanners] = useState<Banner[]>([]);
  const [homePromos, setHomePromos] = useState<Banner[]>([]);
  const [modalPromo, setModalPromo] = useState<Banner | null>(null);
  const [promoVisible, setPromoVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [
        nextHero,
        nextHomePromos,
        nextModalPromo,
        nextCategories,
        nextFeatured,
        alreadySeen,
      ] = await Promise.all([
        listActiveHeroBanners(),
        listHomePromotions(),
        getActivePromoModal(),
        listActiveCategories(),
        listFeaturedProducts(),
        hasSeenPromoModal(),
      ]);
      setHeroBanners(nextHero);
      setHomePromos(nextHomePromos);
      setModalPromo(nextModalPromo);
      setCategories(nextCategories);
      setFeatured(nextFeatured);
      setPromoVisible(Boolean(nextModalPromo) && !alreadySeen);
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

  const banner = heroBanners[0];
  /** Card fixo na home: prioridade do modal, senão primeira campanha ativa. */
  const weekPromo = useMemo(
    () => modalPromo ?? homePromos[0] ?? null,
    [modalPromo, homePromos],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const firstName = profile?.name?.split(" ")[0] ?? "você";

  const openCatalogPromo = () => {
    router.push(CATALOG_PROMO_HREF as Href);
  };

  const openHero = () => {
    if (!banner) return;
    if (banner.destination.type === "category") {
      router.push({
        pathname: "/(tabs)/catalog",
        params: { categoryId: banner.destination.id },
      });
      return;
    }
    if (banner.destination.type === "product" && banner.destination.id) {
      router.push(`/product/${banner.destination.id}`);
      return;
    }
    router.push("/(tabs)/catalog");
  };

  const closePromo = async () => {
    setPromoVisible(false);
    await markPromoModalSeen();
  };

  return (
    <Container onRefresh={() => void load(true)} refreshing={refreshing} scroll>
      {modalPromo ? (
        <PromoModal
          onAction={() => {
            void closePromo().then(() => openCatalogPromo());
          }}
          onClose={() => {
            void closePromo();
          }}
          promo={modalPromo}
          visible={!loading && !error && promoVisible}
        />
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <BrandMark size={96} variant="hero" />
          <View style={styles.headerCopy}>
            <Typography style={styles.brand} variant="caption">
              {brand.fullName}
            </Typography>
            <Typography variant="title">
              {greetingForNow()}, {firstName}
            </Typography>
            <Typography style={styles.headerSub} variant="caption">
              {brand.tagline}
            </Typography>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Abrir perfil"
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.profileButton}
        >
          <Ionicons color={colors.ink} name="person-outline" size={20} />
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
              onPress={openHero}
              style={styles.banner}
            >
              <ImageBackground
                imageStyle={styles.bannerImage}
                source={{ uri: banner.image }}
                style={styles.bannerBackground}
              >
                <View style={styles.bannerOverlay}>
                  <Typography style={styles.bannerEyebrow} variant="caption">
                    Destaque
                  </Typography>
                  <Typography style={styles.bannerTitle} variant="title">
                    {banner.title}
                  </Typography>
                  <View style={styles.bannerCta}>
                    <Typography style={styles.bannerCtaLabel} variant="caption">
                      Explorar
                    </Typography>
                    <Ionicons
                      color={colors.primary}
                      name="arrow-forward"
                      size={14}
                    />
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
            {categories.length === 0 ? (
              <Typography style={styles.categoryEmpty} variant="caption">
                Categorias aparecem aqui quando estiverem disponíveis.
              </Typography>
            ) : (
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
                    <Image
                      source={{ uri: category.image }}
                      style={styles.categoryImage}
                    />
                    <Typography
                      numberOfLines={1}
                      style={styles.categoryLabel}
                      variant="caption"
                    >
                      {category.name}
                    </Typography>
                  </Pressable>
                ))}
              </ScrollView>
            )}
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

          {weekPromo ? (
            <Pressable
              accessibilityHint="Abre o catálogo filtrado por promoção"
              accessibilityLabel={`Promoção da semana: ${weekPromo.title}`}
              accessibilityRole="button"
              onPress={openCatalogPromo}
              style={styles.weekPromo}
            >
              <Image
                source={{ uri: weekPromo.image }}
                style={styles.weekPromoImage}
              />
              <View style={styles.weekPromoCopy}>
                <Typography style={styles.weekPromoEyebrow} variant="caption">
                  Promoção da semana
                </Typography>
                <Typography style={styles.weekPromoTitle} variant="subtitle">
                  {weekPromo.title}
                </Typography>
                {weekPromo.body ? (
                  <Typography
                    numberOfLines={2}
                    style={styles.weekPromoBody}
                    variant="caption"
                  >
                    {weekPromo.body}
                  </Typography>
                ) : null}
                <View style={styles.weekPromoCta}>
                  <Typography style={styles.weekPromoCtaLabel} variant="caption">
                    Ver itens em promoção
                  </Typography>
                  <Ionicons
                    color={colors.white}
                    name="arrow-forward"
                    size={14}
                  />
                </View>
              </View>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Container>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  headerBrand: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  brand: {
    color: palette.ink,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  headerSub: {
    letterSpacing: 0.1,
    maxWidth: 260,
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    marginTop: 4,
    width: 44,
  },
  banner: {
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  bannerBackground: {
    minHeight: 220,
  },
  bannerImage: {
    borderRadius: radius.lg,
  },
  bannerOverlay: {
    backgroundColor: palette.overlay,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    minHeight: 220,
    padding: spacing.lg,
  },
  bannerEyebrow: {
    color: palette.primary,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  bannerTitle: {
    color: palette.white,
    maxWidth: "92%",
  },
  bannerCta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerCtaLabel: {
    color: palette.onPrimary,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: palette.ink,
    fontWeight: "600",
  },
  link: {
    color: palette.ink,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  categoryShell: {
    height: 108,
    marginBottom: spacing.xl,
    marginHorizontal: -CONTENT_PADDING,
  },
  categoryEmpty: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: spacing.md,
  },
  categoryContent: {
    gap: spacing.md,
    paddingHorizontal: CONTENT_PADDING,
  },
  category: {
    alignItems: "center",
    flexShrink: 0,
    gap: spacing.xs,
    width: 76,
  },
  categoryImage: {
    backgroundColor: palette.secondary,
    borderRadius: 38,
    height: 76,
    width: 76,
  },
  categoryLabel: {
    color: palette.ink,
    fontWeight: "600",
    letterSpacing: 0,
    textAlign: "center",
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    marginBottom: spacing.xl,
    width: "100%",
  },
  weekPromo: {
    backgroundColor: palette.brandBlack,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  weekPromoImage: {
    backgroundColor: "#1A1A1A",
    height: 148,
    width: "100%",
  },
  weekPromoCopy: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  weekPromoEyebrow: {
    color: palette.primary,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  weekPromoTitle: {
    color: palette.white,
    fontWeight: "600",
  },
  weekPromoBody: {
    color: "rgba(255,255,255,0.78)",
  },
  weekPromoCta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weekPromoCtaLabel: {
    color: palette.onPrimary,
    fontWeight: "700",
  },
});
}
