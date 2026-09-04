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
  success: "#E7F4EE",
  warning: "#F8F0DE",
  error: "#F8E8EA",
} as const;

export function StockBadge({ status }: StockBadgeProps) {
  const tone = stockTone(status);

  return (
    <View style={[styles.badge, { backgroundColor: toneBackground[tone] }]}>
      <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} />
      <Typography style={{ color: toneColor[tone] }} variant="caption">
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
    height: 8,
    width: 8,
  },
});
