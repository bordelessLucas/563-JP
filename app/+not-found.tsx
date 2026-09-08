import { Href, Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { colors, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

export default function NotFoundScreen() {
  const router = useRouter();

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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.canvas,
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
