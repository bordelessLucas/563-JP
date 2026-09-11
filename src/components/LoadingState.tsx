import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Carregando…" }: LoadingStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "center",
          gap: spacing.md,
          justifyContent: "center",
          paddingVertical: spacing.xl,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Typography variant="caption">{label}</Typography>
    </View>
  );
}
