import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { Input } from "@/src/components/Input";
import { colors, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAuthActions } from "@/src/hooks/useAuthActions";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, login } = useAuthActions();
  const { login: authenticate } = useAuth();
  const handleLogin = async () => {
    const signedIn = await login(email, password, () =>
      authenticate(email, password),
    );
    if (signedIn) router.replace("/home");
  };

  return (
    <Container keyboardAware scroll>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Ionicons color={colors.white} name="flower-outline" size={28} />
        </View>
        <Typography style={styles.eyebrow} variant="caption">
          FLORA &amp; PRESENTES
        </Typography>
        <Typography variant="display">
          Flores que dizem o que você sente.
        </Typography>
        <Typography style={styles.intro} variant="subtitle">
          Entre para encontrar o presente certo para cada momento.
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
          <Input
            autoComplete="password"
            icon="lock-closed-outline"
            isPassword
            label="Senha"
            onChangeText={setPassword}
            placeholder="Sua senha"
            value={password}
          />
          <Pressable onPress={() => router.push("/forgot-password")}>
            <Typography style={styles.forgot} variant="caption">
              Esqueci minha senha
            </Typography>
          </Pressable>
          {error && (
            <Typography style={styles.error} variant="caption">
              {error}
            </Typography>
          )}
          <Button label="Entrar" loading={loading} onPress={handleLogin} />
        </View>

        <View style={styles.registerRow}>
          <Typography variant="caption">Ainda não tem uma conta?</Typography>
          <Pressable onPress={() => router.push("/register")}>
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
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 56,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  intro: {
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
    gap: 4,
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
});
