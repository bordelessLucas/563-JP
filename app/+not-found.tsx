import { Href, Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen options={{ title: "Não encontrado" }} />
      <View style={styles.container}>
        <Typography style={styles.title} variant="title">
          Não encontramos essa tela
        </Typography>
        <Typography style={styles.description} variant="caption">
          O endereço pode estar desatualizado ou o link não existe mais.
        </Typography>
        <Button
          label="Ir para o início"
          onPress={() => router.replace("/(tabs)" as Href)}
        />
      </View>
    </>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: palette.canvas,
      flex: 1,
      gap: spacing.md,
      justifyContent: "center",
      padding: spacing.xl,
    },
    title: {
      textAlign: "center",
    },
    description: {
      marginBottom: spacing.md,
      textAlign: "center",
    },
  });
}
