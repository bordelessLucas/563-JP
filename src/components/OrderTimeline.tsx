import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { InlineNotice } from "@/src/components/InlineNotice";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import { CLIENT_TIMELINE_STEPS } from "@/src/utils/orderLabels";
import { OrderStatus } from "@/src/types/order";

type OrderTimelineProps = {
  orderStatus: OrderStatus;
};

export function OrderTimeline({ orderStatus }: OrderTimelineProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (orderStatus === "cancelled") {
    return (
      <InlineNotice
        description="Este pedido foi cancelado. Os passos de entrega não se aplicam."
        title="Pedido cancelado"
        tone="warning"
      />
    );
  }

  const onTimeline = CLIENT_TIMELINE_STEPS.some((step) =>
    (step.match as readonly string[]).includes(orderStatus),
  );

  if (!onTimeline) {
    return (
      <InlineNotice
        description="Assim que o pagamento for confirmado, a timeline de entrega aparece aqui."
        title="Aguardando confirmação"
        tone="info"
      />
    );
  }

  return (
    <View style={styles.list}>
      {CLIENT_TIMELINE_STEPS.map((step, index) => {
        const done = (step.match as readonly string[]).includes(orderStatus);
        const isCurrent =
          done &&
          (index === CLIENT_TIMELINE_STEPS.length - 1 ||
            !(
              CLIENT_TIMELINE_STEPS[index + 1].match as readonly string[]
            ).includes(orderStatus));

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                ]}
              />
              {index < CLIENT_TIMELINE_STEPS.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <View style={styles.copy}>
              <Typography
                style={[styles.label, done && styles.labelDone]}
                variant="body"
              >
                {step.label}
              </Typography>
              {isCurrent ? (
                <Typography variant="caption">Status atual</Typography>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: 0,
    },
    row: {
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 56,
    },
    rail: {
      alignItems: "center",
      width: 20,
    },
    dot: {
      backgroundColor: palette.border,
      borderRadius: radius.xl,
      height: 14,
      marginTop: 4,
      width: 14,
    },
    dotDone: {
      backgroundColor: palette.ink,
    },
    dotCurrent: {
      backgroundColor: palette.primary,
      borderColor: palette.ink,
      borderWidth: 2,
      height: 16,
      width: 16,
    },
    line: {
      backgroundColor: palette.border,
      flex: 1,
      marginVertical: 4,
      width: 2,
    },
    lineDone: {
      backgroundColor: palette.ink,
    },
    copy: {
      flex: 1,
      gap: 2,
      paddingBottom: spacing.md,
    },
    label: {
      color: palette.muted,
    },
    labelDone: {
      color: palette.ink,
      fontWeight: "700",
    },
  });
}
