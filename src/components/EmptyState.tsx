import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: palette.brandBlack,
      borderRadius: radius.xl,
      height: 64,
      justifyContent: "center",
      marginBottom: spacing.xs,
      width: 64,
    },
    title: {
      color: palette.ink,
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
}
