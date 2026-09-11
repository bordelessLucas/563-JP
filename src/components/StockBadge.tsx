import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import { StockStatus } from "@/src/types/catalog";
import { stockLabel, stockTone } from "@/src/utils/format";

type StockBadgeProps = {
  status: StockStatus;
};

export function StockBadge({ status }: StockBadgeProps) {
  const { colors } = useTheme();
  const tone = stockTone(status);
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
  const styles = useMemo(() => createStyles(colors), [colors]);

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

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
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
}
