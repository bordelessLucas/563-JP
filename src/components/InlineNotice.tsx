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
    border: colors.border,
    icon: "information-circle-outline" as const,
    iconColor: colors.primary,
  },
  success: {
    background: colors.successSoft,
    border: "#C9E6D7",
    icon: "checkmark-circle-outline" as const,
    iconColor: colors.success,
  },
  warning: {
    background: colors.warningSoft,
    border: "#EBD9B0",
    icon: "alert-circle-outline" as const,
    iconColor: colors.warning,
  },
  error: {
    background: colors.errorSoft,
    border: "#E8C4C8",
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

const styles = StyleSheet.create({
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
