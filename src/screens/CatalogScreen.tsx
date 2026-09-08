import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
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
import { listActiveCategories } from "@/src/services/category.service";
import { listActiveProducts } from "@/src/services/product.service";
import { Category, isProductOnPromo, Product } from "@/src/types/catalog";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - GRID_GAP) / 2;

type CatalogFilter = "all" | "promo" | string;

export function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId?: string | string[];
    filter?: string | string[];
  }>();
  const rawCategoryId = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const rawFilter = Array.isArray(params.filter)
    ? params.filter[0]
    : params.filter;

  const selectedCategoryId =
    typeof rawCategoryId === "string" && rawCategoryId.length > 0
      ? rawCategoryId
      : undefined;
  const promoFilter = rawFilter === "promo";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [nextCategories, nextProducts] = await Promise.all([
        listActiveCategories(),
        listActiveProducts(),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch {
      setError("Não foi possível carregar o catálogo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const selectedCategoryName = selectedCategoryId
    ? categoryMap.get(selectedCategoryId)
    : undefined;

  const activeFilter: CatalogFilter = promoFilter
    ? "promo"
    : selectedCategoryId || "all";

  const filteredProducts = useMemo(() => {
    if (promoFilter) {
      return products.filter((product) => isProductOnPromo(product));
    }
    if (!selectedCategoryId) return products;
    return products.filter(
      (product) => product.categoryId === selectedCategoryId,
    );
  }, [products, promoFilter, selectedCategoryId]);

  const clearFilter = () => {
    router.setParams({ categoryId: "", filter: "" });
  };

  const selectAll = () => clearFilter();

  const selectPromo = () => {
    router.setParams({ categoryId: "", filter: "promo" });
  };

  const selectCategory = (categoryId: string) => {
    router.setParams({ categoryId, filter: "" });
  };

  const filterLabel = promoFilter
    ? "em promoção"
    : selectedCategoryName
      ? `em ${selectedCategoryName}`
      : "";

  return (
    <Container onRefresh={() => void load(true)} refreshing={refreshing} scroll>
      <Typography variant="caption">CATÁLOGO</Typography>
      <Typography style={styles.title} variant="title">
        Encontre o presente certo
      </Typography>
      <Typography style={styles.subtitle} variant="caption">
        Filtre por promoção ou categoria. Puxe para atualizar.
      </Typography>

      <View style={styles.filtersShell}>
        <ScrollView
          contentContainerStyle={styles.filtersContent}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeFilter === "all" }}
            onPress={selectAll}
            style={[styles.chip, activeFilter === "all" && styles.chipActive]}
          >
            <Typography
              style={[
                styles.chipLabel,
                activeFilter === "all" && styles.chipLabelActive,
              ]}
              variant="caption"
            >
              Todos
            </Typography>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: promoFilter }}
            onPress={selectPromo}
            style={[
              styles.chip,
              styles.chipPromo,
              promoFilter && styles.chipPromoActive,
            ]}
          >
            <Typography
              style={[
                styles.chipLabel,
                styles.chipPromoLabel,
                promoFilter && styles.chipLabelActive,
              ]}
              variant="caption"
            >
              Promoção
            </Typography>
          </Pressable>
          {categories.map((category) => {
            const selected = activeFilter === category.id;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => selectCategory(category.id)}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Typography
                  numberOfLines={1}
                  style={[styles.chipLabel, selected && styles.chipLabelActive]}
                  variant="caption"
                >
                  {category.name}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!loading && !error ? (
        <View style={styles.resultRow}>
          <Typography style={styles.resultLabel} variant="caption">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "produto" : "produtos"}
            {filterLabel ? ` ${filterLabel}` : ""}
          </Typography>
          {activeFilter !== "all" ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={clearFilter}
            >
              <Typography style={styles.clear} variant="caption">
                Limpar filtro
              </Typography>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading ? <LoadingState label="Carregando produtos..." /> : null}

      {!loading && error ? (
        <EmptyState
          actionLabel="Tentar novamente"
          description={error}
          icon="alert-circle-outline"
          onAction={() => void load()}
          title="Não foi possível carregar os produtos"
        />
      ) : null}

      {!loading && !error && filteredProducts.length === 0 ? (
        <EmptyState
          actionLabel="Ver todos"
          description={
            promoFilter
              ? "Nenhum item em promoção agora. Veja o catálogo completo."
              : "Tente outra categoria ou limpe o filtro."
          }
          onAction={clearFilter}
          title={
            promoFilter
              ? "Sem promoções no momento"
              : "Nenhum produto nesta categoria"
          }
        />
      ) : null}

      {!loading && !error && filteredProducts.length > 0 ? (
        <View style={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              categoryName={categoryMap.get(product.categoryId)}
              onPress={() => router.push(`/product/${product.id}`)}
              product={product}
              width={CARD_WIDTH}
            />
          ))}
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  filtersShell: {
    height: 52,
    marginBottom: spacing.md,
    marginHorizontal: -CONTENT_PADDING,
  },
  filtersContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: CONTENT_PADDING,
  },
  chip: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexShrink: 0,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPromo: {
    backgroundColor: colors.softAccent,
    borderColor: colors.border,
  },
  chipPromoActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  chipPromoLabel: {
    color: colors.accent,
  },
  chipLabelActive: {
    color: colors.white,
  },
  resultRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginBottom: spacing.md,
    minHeight: 24,
  },
  resultLabel: {
    flex: 1,
    flexShrink: 1,
  },
  clear: {
    color: colors.primary,
    flexShrink: 0,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingBottom: spacing.xl,
    width: "100%",
  },
});
