import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  icon = "leaf-outline",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name={icon} size={26} />
      </View>
      <Typography style={styles.title} variant="subtitle">
        {title}
      </Typography>
      <Typography style={styles.description} variant="caption">
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    marginBottom: spacing.xs,
    width: 64,
  },
  title: {
    color: colors.ink,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    letterSpacing: 0.1,
    maxWidth: 280,
    textAlign: "center",
  },
  action: {
    marginTop: spacing.md,
    minWidth: 220,
  },
});
