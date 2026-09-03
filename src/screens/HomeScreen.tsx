import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { colors, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";

const categories = [
  { icon: "flower-outline" as const, label: "Flores" },
  { icon: "gift-outline" as const, label: "Presentes" },
  { icon: "heart-outline" as const, label: "Ocasiões" },
];

export function HomeScreen() {
  const { logout } = useAuth();
  const handleOpenCategory = () => {};

  return (
    <Container scroll>
      <View style={styles.header}>
        <View>
          <Typography variant="caption">BOM DIA</Typography>
          <Typography variant="title">Olá, você</Typography>
        </View>
        <Pressable
          accessibilityLabel="Sair"
          style={styles.profileButton}
          onPress={logout}
        >
          <Ionicons color={colors.primary} name="person-outline" size={21} />
        </Pressable>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerCopy}>
          <Typography style={styles.bannerEyebrow} variant="caption">
            UM GESTO QUE FLORESCE
          </Typography>
          <Typography style={styles.bannerTitle} variant="title">
            Escolha algo especial hoje.
          </Typography>
          <Button
            label="Explorar"
            onPress={handleOpenCategory}
            variant="secondary"
          />
        </View>
        <View style={styles.flowerShape}>
          <Ionicons color={colors.accent} name="flower" size={74} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Typography variant="subtitle">Encontre por categoria</Typography>
        <Typography style={styles.seeAll} variant="caption">
          Ver tudo
        </Typography>
      </View>
      <View style={styles.categoryRow}>
        {categories.map((category) => (
          <Pressable
            key={category.label}
            onPress={handleOpenCategory}
            style={styles.category}
          >
            <View style={styles.categoryIcon}>
              <Ionicons color={colors.primary} name={category.icon} size={25} />
            </View>
            <Typography style={styles.categoryLabel} variant="caption">
              {category.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Typography variant="subtitle">Inspiração para você</Typography>
      </View>
      <View style={styles.productPlaceholder}>
        <View style={styles.placeholderImage}>
          <Ionicons color={colors.accent} name="image-outline" size={34} />
        </View>
        <View style={styles.placeholderLines}>
          <View style={styles.lineLong} />
          <View style={styles.lineShort} />
          <View style={styles.linePrice} />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    flexDirection: "row",
    minHeight: 190,
    overflow: "hidden",
    padding: spacing.lg,
  },
  bannerCopy: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    zIndex: 1,
  },
  bannerEyebrow: {
    color: colors.secondary,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 28,
  },
  flowerShape: {
    alignItems: "center",
    justifyContent: "center",
    width: 90,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  seeAll: {
    color: colors.primary,
    fontWeight: "700",
  },
  categoryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  category: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  categoryIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 68,
    justifyContent: "center",
    width: "100%",
  },
  categoryLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  productPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm,
  },
  placeholderImage: {
    alignItems: "center",
    backgroundColor: colors.softAccent,
    borderRadius: 14,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  placeholderLines: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
  },
  lineLong: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 12,
    width: "78%",
  },
  lineShort: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 10,
    width: "52%",
  },
  linePrice: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
    height: 18,
    width: "34%",
  },
});
