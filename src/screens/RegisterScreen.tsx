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

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, register } = useAuthActions();
  const { register: createAccount } = useAuth();
  const handleRegister = async () => {
    const registered = await register(name, email, password, () =>
      createAccount(name, email, password),
    );
    if (registered) router.replace("/home");
  };

  return (
    <Container keyboardAware scroll>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Typography style={styles.back} variant="caption">
            Voltar
          </Typography>
        </Pressable>
        <Typography variant="title">Crie seu espaço</Typography>
        <Typography style={styles.intro} variant="subtitle">
          Salve seus endereços e acompanhe cada pedido com facilidade.
        </Typography>
        <View style={styles.form}>
          <Input
            icon="person-outline"
            label="Nome completo"
            onChangeText={setName}
            placeholder="Como podemos chamar você?"
            value={name}
          />
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
            autoComplete="new-password"
            icon="lock-closed-outline"
            isPassword
            label="Senha"
            onChangeText={setPassword}
            placeholder="Crie uma senha segura"
            value={password}
          />
          {error && (
            <Typography style={styles.error} variant="caption">
              {error}
            </Typography>
          )}
          <Button
            label="Criar conta"
            loading={loading}
            onPress={handleRegister}
          />
        </View>
        <View style={styles.loginRow}>
          <Typography variant="caption">Já possui uma conta?</Typography>
          <Pressable onPress={() => router.replace("/login")}>
            <Typography style={styles.link} variant="caption">
              Entrar
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
  error: {
    color: colors.error,
  },
  form: {
    gap: spacing.md,
  },
  loginRow: {
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
