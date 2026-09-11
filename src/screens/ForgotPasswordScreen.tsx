import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { error, loading, requestReset } = useAuthActions();

  const handleReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError("Informe o e-mail da conta.");
      return;
    }
    setLocalError(null);
    const requested = await requestReset(trimmed);
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
            onChangeText={(value) => {
              setEmail(value);
              setLocalError(null);
            }}
            placeholder="voce@email.com"
            value={email}
          />
          {(localError || error) && (
            <Typography style={styles.error} variant="caption">
              {localError || error}
            </Typography>
          )}
          {sent && (
            <Typography style={styles.success} variant="caption">
              Link enviado. Verifique seu e-mail.
            </Typography>
          )}
          <Button
            disabled={!email.trim()}
            label="Enviar link"
            loading={loading}
            onPress={() => {
              void handleReset();
            }}
          />
          {sent ? (
            <Button
              label="Ir para o login"
              onPress={() => router.replace("/login")}
              variant="outline"
            />
          ) : null}
        </View>
      </View>
    </Container>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    back: {
      color: palette.primary,
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
      color: palette.error,
    },
    success: {
      color: palette.primary,
    },
  });
}
