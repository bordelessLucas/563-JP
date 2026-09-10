import { Image, Pressable, StyleSheet, View } from "react-native";

import { StockBadge } from "@/src/components/StockBadge";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import {
  hasPromoDiscount,
  isProductOnPromo,
  Product,
  productEffectivePrice,
} from "@/src/types/catalog";
import { formatCurrency } from "@/src/utils/format";

type ProductCardProps = {
  product: Product;
  categoryName?: string;
  onPress: () => void;
  width?: number | `${number}%`;
};

export function ProductCard({
  product,
  categoryName,
  onPress,
  width = "48%",
}: ProductCardProps) {
  const image = product.images[0];
  const unavailable = product.stockStatus === "out_of_stock";
  const onPromo = isProductOnPromo(product);
  const discounted = hasPromoDiscount(product);
  const effective = productEffectivePrice(product);

  return (
    <Pressable
      accessibilityHint={
        unavailable
          ? "Produto esgotado. Abre os detalhes."
          : onPromo
            ? "Produto em promoção. Abre os detalhes."
            : "Abre os detalhes do produto"
      }
      accessibilityLabel={`${product.name}, ${formatCurrency(effective)}${onPromo ? ", promoção" : ""}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
        unavailable && styles.unavailable,
      ]}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: image }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        {onPromo ? (
          <View style={styles.promoBadge}>
            <Typography style={styles.promoBadgeLabel} variant="caption">
              Promo
            </Typography>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        {categoryName ? (
          <Typography numberOfLines={1} style={styles.category} variant="caption">
            {categoryName}
          </Typography>
        ) : null}
        <Typography numberOfLines={2} style={styles.name} variant="body">
          {product.name}
        </Typography>
        {discounted ? (
          <View style={styles.priceRow}>
            <Typography style={styles.priceOld} variant="caption">
              {formatCurrency(product.price)}
            </Typography>
            <Typography style={styles.pricePromo} variant="subtitle">
              {formatCurrency(effective)}
            </Typography>
          </View>
        ) : (
          <Typography style={styles.price} variant="subtitle">
            {formatCurrency(effective)}
          </Typography>
        )}
        <StockBadge status={product.stockStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.94,
  },
  unavailable: {
    opacity: 0.55,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    backgroundColor: colors.secondary,
    height: 156,
    width: "100%",
  },
  imageFallback: {
    backgroundColor: colors.softAccent,
  },
  promoBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    position: "absolute",
    top: spacing.sm,
  },
  promoBadgeLabel: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  content: {
    gap: 6,
    padding: spacing.md,
  },
  category: {
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: {
    fontWeight: "600",
    letterSpacing: 0,
    minHeight: 40,
  },
  price: {
    color: colors.primary,
    fontWeight: "700",
  },
  priceRow: {
    gap: 2,
  },
  priceOld: {
    color: colors.muted,
    letterSpacing: 0,
    textDecorationLine: "line-through",
  },
  pricePromo: {
    color: colors.accent,
    fontWeight: "700",
  },
});
