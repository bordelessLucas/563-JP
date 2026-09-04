import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";

export function ProfileScreen() {
  const { profile, logout } = useAuth();
  const initial = (profile?.name?.trim()?.[0] ?? "F").toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sair da conta", "Deseja encerrar a sessão neste dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <Container scroll>
      <Typography variant="caption">PERFIL</Typography>
      <Typography style={styles.title} variant="title">
        Minha conta
      </Typography>

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Typography style={styles.avatarLabel} variant="title">
            {initial}
          </Typography>
        </View>
        <View style={styles.heroCopy}>
          <Typography style={styles.name} variant="subtitle">
            {profile?.name ?? "Cliente"}
          </Typography>
          <Typography variant="caption">{profile?.email ?? "—"}</Typography>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons color={colors.primary} name="person-outline" size={18} />
          <View style={styles.rowCopy}>
            <Typography variant="caption">Nome</Typography>
            <Typography style={styles.value} variant="body">
              {profile?.name ?? "—"}
            </Typography>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons color={colors.primary} name="mail-outline" size={18} />
          <View style={styles.rowCopy}>
            <Typography variant="caption">E-mail</Typography>
            <Typography style={styles.value} variant="body">
              {profile?.email ?? "—"}
            </Typography>
          </View>
        </View>
      </View>

      <InlineNotice
        description="Endereços salvos, telefone e preferências de entrega entram nas próximas etapas."
        title="Mais opções em breve"
        tone="info"
      />

      <View style={styles.logout}>
        <Button label="Sair da conta" onPress={handleLogout} variant="outline" />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarLabel: {
    color: colors.primary,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.ink,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontWeight: "700",
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  logout: {
    marginTop: spacing.xl,
  },
});
