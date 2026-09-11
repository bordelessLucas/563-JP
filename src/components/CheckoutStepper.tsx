import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { spacing, touchTarget } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

const STEP_LABELS = [
  "Destinatário",
  "Endereço",
  "Agenda",
  "Resumo",
  "Pagamento",
] as const;

type CheckoutStepperProps = {
  step: 1 | 2 | 3 | 4 | 5;
};

export function CheckoutStepper({ step }: CheckoutStepperProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {STEP_LABELS.map((label, index) => {
          const number = (index + 1) as 1 | 2 | 3 | 4 | 5;
          const done = number < step;
          const current = number === step;
          return (
            <View key={label} style={styles.stepItem}>
              {index > 0 ? (
                <View
                  style={[styles.line, (done || current) && styles.lineDone]}
                />
              ) : (
                <View style={styles.lineSpacer} />
              )}
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                ]}
              />
            </View>
          );
        })}
      </View>
      <Typography style={styles.label} variant="caption">
        {STEP_LABELS[step - 1]} · {step} de 5
      </Typography>
    </View>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: touchTarget / 2,
    },
    stepItem: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
    },
    line: {
      backgroundColor: palette.border,
      flex: 1,
      height: 1,
      marginRight: 4,
    },
    lineDone: {
      backgroundColor: palette.ink,
    },
    lineSpacer: {
      flex: 1,
    },
    dot: {
      backgroundColor: palette.border,
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    dotDone: {
      backgroundColor: palette.ink,
    },
    dotCurrent: {
      backgroundColor: palette.primary,
      borderColor: palette.ink,
      borderWidth: 2,
      height: 12,
      width: 12,
    },
    label: {
      color: palette.ink,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
  });
}
