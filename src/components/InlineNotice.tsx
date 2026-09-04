import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

type InlineNoticeProps = {
  title: string;
  description: string;
  tone?: "info" | "success" | "warning" | "error";
};

const toneStyles = {
  info: {
    background: colors.secondary,
    icon: "information-circle-outline" as const,
    iconColor: colors.primary,
  },
  success: {
    background: "#E7F4EE",
    icon: "checkmark-circle-outline" as const,
    iconColor: colors.success,
  },
  warning: {
    background: "#F8F0DE",
    icon: "alert-circle-outline" as const,
    iconColor: colors.warning,
  },
  error: {
    background: "#F8E8EA",
    icon: "close-circle-outline" as const,
    iconColor: colors.error,
  },
};

export function InlineNotice({
  title,
  description,
  tone = "info",
}: InlineNoticeProps) {
  const palette = toneStyles[tone];

  return (
    <View style={[styles.card, { backgroundColor: palette.background }]}>
      <Ionicons color={palette.iconColor} name={palette.icon} size={22} />
      <View style={styles.copy}>
        <Typography style={styles.title} variant="body">
          {title}
        </Typography>
        <Typography variant="caption">{description}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: "700",
  },
});
