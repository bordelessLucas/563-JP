import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

type InlineNoticeProps = {
  title: string;
  description: string;
  tone?: "info" | "success" | "warning" | "error";
};

export function InlineNotice({
  title,
  description,
  tone = "info",
}: InlineNoticeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const palette = {
    info: {
      background: colors.secondary,
      border: colors.border,
      icon: "information-circle-outline" as const,
      iconColor: colors.ink,
    },
    success: {
      background: colors.successSoft,
      border: colors.border,
      icon: "checkmark-circle-outline" as const,
      iconColor: colors.success,
    },
    warning: {
      background: colors.warningSoft,
      border: colors.border,
      icon: "alert-circle-outline" as const,
      iconColor: colors.warning,
    },
    error: {
      background: colors.errorSoft,
      border: colors.border,
      icon: "close-circle-outline" as const,
      iconColor: colors.error,
    },
  }[tone];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons color={palette.iconColor} name={palette.icon} size={20} />
      <View style={styles.copy}>
        <Typography style={styles.title} variant="body">
          {title}
        </Typography>
        <Typography style={styles.description} variant="caption">
          {description}
        </Typography>
      </View>
    </View>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0,
    },
    description: {
      letterSpacing: 0.1,
      lineHeight: 17,
    },
  });
}
