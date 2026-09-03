import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { colors, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { error, loading, requestReset } = useAuthActions();

  const handleReset = async () => {
    const requested = await requestReset(email);
    if (requested) setSent(true);
  };

  return (
    <Container keyboardAware scroll>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Typography style={styles.back} variant="caption">
            Voltar
          </Typography>
        </Pressable>
        <Typography variant="title">Recupere sua senha</Typography>
        <Typography style={styles.intro} variant="subtitle">
          Enviaremos um link para você criar uma nova senha.
        </Typography>
        <View style={styles.form}>
          <Input
            autoComplete="email"
            icon="mail-outline"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="voce@email.com"
            value={email}
          />
          {error && (
            <Typography style={styles.error} variant="caption">
              {error}
            </Typography>
          )}
          {sent && (
            <Typography style={styles.success} variant="caption">
              Link enviado. Verifique seu e-mail.
            </Typography>
          )}
          <Button label="Enviar link" loading={loading} onPress={handleReset} />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  back: {
    color: colors.primary,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  intro: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.error,
  },
  success: {
    color: colors.primary,
  },
});
