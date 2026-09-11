import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, register } = useAuthActions();
  const { register: createAccount } = useAuth();

  const canSubmit = useMemo(
    () =>
      name.trim().length > 1 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      !loading,
    [email, loading, name, password],
  );

  const handleRegister = async () => {
    if (!canSubmit) return;
    await register(name.trim(), email.trim(), password, () =>
      createAccount(name.trim(), email.trim(), password),
    );
  };

  return (
    <Container keyboardAware scroll>
      <View style={styles.content}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <Typography style={styles.back} variant="caption">
            Voltar
          </Typography>
        </Pressable>
        <Typography variant="title">Crie sua conta</Typography>
        <Typography style={styles.intro} variant="subtitle">
          Em poucos passos você já pode explorar flores e presentes.
        </Typography>
        <View style={styles.form}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            icon="person-outline"
            label="Nome completo"
            onChangeText={setName}
            placeholder="Como podemos chamar você?"
            textContentType="name"
            value={name}
          />
          <Input
            autoComplete="email"
            icon="mail-outline"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="voce@email.com"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            autoComplete="new-password"
            icon="lock-closed-outline"
            isPassword
            label="Senha"
            onChangeText={setPassword}
            placeholder="Mínimo de 6 caracteres"
            textContentType="newPassword"
            value={password}
          />
          {error ? (
            <Typography style={styles.error} variant="caption">
              {error}
            </Typography>
          ) : null}
          <Button
            disabled={!canSubmit}
            label="Criar conta"
            loading={loading}
            onPress={() => {
              void handleRegister();
            }}
          />
        </View>
        <View style={styles.loginRow}>
          <Typography variant="caption">Já possui uma conta?</Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
          >
            <Typography style={styles.link} variant="caption">
              Entrar
            </Typography>
          </Pressable>
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
    error: {
      color: palette.error,
    },
    form: {
      gap: spacing.md,
    },
    loginRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
      marginTop: spacing.xl,
    },
    link: {
      color: palette.primary,
      fontWeight: "700",
    },
  });
}
