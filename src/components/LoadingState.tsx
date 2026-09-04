import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Carregando..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Typography variant="caption">{label}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
});
