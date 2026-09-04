import { Image, Pressable, StyleSheet, View } from "react-native";

import { StockBadge } from "@/src/components/StockBadge";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { Product } from "@/src/types/catalog";
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

  return (
    <Pressable
      accessibilityHint="Abre os detalhes do produto"
      accessibilityLabel={`${product.name}, ${formatCurrency(product.price)}`}
      accessibilityRole="button"
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
        unavailable && styles.unavailable,
      ]}
    >
      {image ? (
        <Image accessibilityIgnoresInvertColors source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.content}>
        {categoryName ? (
          <Typography numberOfLines={1} variant="caption">
            {categoryName}
          </Typography>
        ) : null}
        <Typography numberOfLines={2} style={styles.name} variant="body">
          {product.name}
        </Typography>
        <Typography style={styles.price} variant="subtitle">
          {formatCurrency(product.price)}
        </Typography>
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
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  unavailable: {
    opacity: 0.55,
  },
  image: {
    backgroundColor: colors.secondary,
    height: 148,
    width: "100%",
  },
  imageFallback: {
    backgroundColor: colors.softAccent,
  },
  content: {
    gap: 6,
    padding: spacing.sm,
  },
  name: {
    fontWeight: "700",
    minHeight: 40,
  },
  price: {
    color: colors.primary,
    fontWeight: "700",
  },
});
