import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { StockStatus } from "@/src/types/catalog";
import { stockLabel, stockTone } from "@/src/utils/format";

type StockBadgeProps = {
  status: StockStatus;
};

const toneColor = {
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
} as const;

const toneBackground = {
  success: colors.successSoft,
  warning: colors.warningSoft,
  error: colors.errorSoft,
} as const;

export function StockBadge({ status }: StockBadgeProps) {
  const tone = stockTone(status);

  return (
    <View style={[styles.badge, { backgroundColor: toneBackground[tone] }]}>
      <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} />
      <Typography
        style={[styles.label, { color: toneColor[tone] }]}
        variant="caption"
      >
        {stockLabel(status)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
