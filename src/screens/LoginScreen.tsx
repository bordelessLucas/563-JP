import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BrandMark } from "@/src/components/BrandMark";
import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { brand } from "@/src/constants/brand";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <View style={styles.brandBlock}>
          <BrandMark size={128} />
          <Typography style={styles.eyebrow} variant="caption">
            {brand.fullName}
          </Typography>
          <Typography style={styles.tagline} variant="display">
            {brand.tagline}
          </Typography>
          <Typography style={styles.intro} variant="body">
            Buquês, noivas e presentes com flores frescas em {brand.city}.
          </Typography>
        </View>

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
            variant="dark"
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

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      gap: spacing.lg,
      justifyContent: "center",
      paddingVertical: spacing.xl,
    },
    brandBlock: {
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    eyebrow: {
      color: palette.ink,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginTop: spacing.md,
      textAlign: "center",
      textTransform: "uppercase",
    },
    tagline: {
      color: palette.ink,
      textAlign: "center",
    },
    intro: {
      color: palette.muted,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    form: {
      gap: spacing.md,
    },
    forgot: {
      alignSelf: "flex-end",
      color: palette.ink,
      fontWeight: "700",
    },
    error: {
      color: palette.error,
    },
    registerRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
      marginTop: spacing.md,
    },
    link: {
      color: palette.ink,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
}
