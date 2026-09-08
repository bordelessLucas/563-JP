import { StyleSheet, View } from "react-native";

import { colors, spacing, touchTarget } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

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
        Etapa {step} de 5 · {STEP_LABELS[step - 1]}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    backgroundColor: colors.border,
    flex: 1,
    height: 2,
    marginRight: 4,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  lineSpacer: {
    flex: 1,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 14,
    width: 14,
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 3,
    height: 16,
    width: 16,
  },
  label: {
    fontWeight: "700",
  },
});
