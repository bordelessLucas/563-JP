import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, login } = useAuthActions();
  const { login: authenticate } = useAuth();

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6 && !loading,
    [email, loading, password],
  );

  const handleLogin = async () => {
    if (!canSubmit) return;
    await login(email.trim(), password, () =>
      authenticate(email.trim(), password),
    );
  };

  return (
    <Container keyboardAware scroll>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Ionicons color={colors.white} name="flower-outline" size={28} />
        </View>
        <Typography style={styles.eyebrow} variant="caption">
          Flora & Presentes
        </Typography>
        <Typography variant="display">
          Flores que dizem o que você sente.
        </Typography>
        <Typography style={styles.intro} variant="body">
          Entre para escolher o arranjo certo para cada momento.
        </Typography>

        <View style={styles.form}>
          <Input
            autoComplete="email"
            icon="mail-outline"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="voce@email.com"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <Input
            autoComplete="password"
            icon="lock-closed-outline"
            isPassword
            label="Senha"
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void handleLogin();
            }}
            placeholder="Sua senha"
            returnKeyType="go"
            textContentType="password"
            value={password}
          />
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/forgot-password")}
          >
            <Typography style={styles.forgot} variant="caption">
              Esqueci minha senha
            </Typography>
          </Pressable>
          {error ? (
            <Typography style={styles.error} variant="caption">
              {error}
            </Typography>
          ) : null}
          <Button
            disabled={!canSubmit}
            label="Entrar"
            loading={loading}
            onPress={() => {
              void handleLogin();
            }}
          />
        </View>

        <View style={styles.registerRow}>
          <Typography variant="caption">Ainda não tem uma conta?</Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/register")}
          >
            <Typography style={styles.link} variant="caption">
              Criar conta
            </Typography>
          </Pressable>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 56,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  intro: {
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.primary,
    fontWeight: "700",
  },
  error: {
    color: colors.error,
  },
  registerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
});
