import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";

import { BrandMark } from "@/src/components/BrandMark";
import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { brand, whatsappUrl } from "@/src/constants/brand";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors, ThemePreference } from "@/src/theme/types";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "system", label: "Sistema", icon: "phone-portrait-outline" },
  { value: "light", label: "Claro", icon: "sunny-outline" },
  { value: "dark", label: "Escuro", icon: "moon-outline" },
];

export function ProfileScreen() {
  const { profile, logout } = useAuth();
  const { colors, preference, setPreference, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = (profile?.name?.trim()?.[0] ?? "C").toUpperCase();

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

  const openWhatsApp = () => {
    void Linking.openURL(
      whatsappUrl("Olá! Gostaria de informações sobre flores da Chuva de Ouro."),
    );
  };

  return (
    <Container scroll>
      <Typography style={styles.eyebrow} variant="caption">
        Perfil
      </Typography>
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
          <Typography style={styles.mutedText} variant="caption">
            {profile?.email ?? "—"}
          </Typography>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons color={colors.ink} name="person-outline" size={18} />
          <View style={styles.rowCopy}>
            <Typography style={styles.mutedText} variant="caption">
              Nome
            </Typography>
            <Typography style={styles.value} variant="body">
              {profile?.name ?? "—"}
            </Typography>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons color={colors.ink} name="mail-outline" size={18} />
          <View style={styles.rowCopy}>
            <Typography style={styles.mutedText} variant="caption">
              E-mail
            </Typography>
            <Typography style={styles.value} variant="body">
              {profile?.email ?? "—"}
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Typography style={styles.sectionLabel} variant="caption">
          Aparência
        </Typography>
        <Typography style={styles.sectionHint} variant="caption">
          {preference === "system"
            ? `Seguindo o tema do celular (${isDark ? "escuro" : "claro"}).`
            : preference === "dark"
              ? "Tema escuro: preto e dourado."
              : "Tema claro: branco e dourado."}
        </Typography>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const active = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(option.value)}
                style={[styles.themeChip, active && styles.themeChipOn]}
              >
                <Ionicons
                  color={active ? colors.onPrimary : colors.ink}
                  name={option.icon}
                  size={18}
                />
                <Typography
                  style={[styles.themeChipLabel, active && styles.themeChipLabelOn]}
                  variant="caption"
                >
                  {option.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.storeCard}>
        <View style={styles.storeHeader}>
          <BrandMark size={48} />
          <View style={styles.storeCopy}>
            <Typography style={styles.storeName} variant="subtitle">
              {brand.fullName}
            </Typography>
            <Typography style={styles.storeCity} variant="caption">
              {brand.city}
            </Typography>
          </View>
        </View>
        <Typography style={styles.mutedText} variant="caption">
          {brand.address}
        </Typography>
        <Typography style={styles.mutedText} variant="caption">
          {brand.hours}
        </Typography>
        <Typography style={styles.mutedText} variant="caption">
          {brand.hoursNote}
        </Typography>
        <Button
          label={`WhatsApp ${brand.phoneDisplay}`}
          onPress={openWhatsApp}
          variant="whatsapp"
        />
      </View>

      <View style={styles.logout}>
        <Button label="Sair da conta" onPress={handleLogout} variant="outline" />
      </View>
    </Container>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    eyebrow: {
      color: palette.ink,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    title: {
      color: palette.ink,
      marginBottom: spacing.lg,
    },
    hero: {
      alignItems: "center",
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    avatar: {
      alignItems: "center",
      backgroundColor: palette.brandBlack,
      borderRadius: 28,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    avatarLabel: {
      color: palette.primary,
    },
    heroCopy: {
      flex: 1,
      gap: 2,
    },
    name: {
      color: palette.ink,
      fontWeight: "700",
    },
    mutedText: {
      color: palette.muted,
    },
    value: {
      color: palette.ink,
      fontWeight: "600",
    },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    rowCopy: {
      flex: 1,
      gap: 2,
    },
    divider: {
      backgroundColor: palette.border,
      height: 1,
      marginVertical: spacing.md,
    },
    sectionLabel: {
      color: palette.ink,
      fontWeight: "700",
      letterSpacing: 1,
      marginBottom: spacing.xs,
      textTransform: "uppercase",
    },
    sectionHint: {
      color: palette.muted,
      marginBottom: spacing.md,
    },
    themeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    themeChip: {
      alignItems: "center",
      backgroundColor: palette.canvas,
      borderColor: palette.border,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    themeChipOn: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    themeChipLabel: {
      color: palette.ink,
      fontWeight: "700",
    },
    themeChipLabelOn: {
      color: palette.onPrimary,
    },
    storeCard: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    storeHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    storeCopy: {
      flex: 1,
      gap: 2,
    },
    storeName: {
      color: palette.ink,
      fontWeight: "700",
    },
    storeCity: {
      color: palette.primary,
    },
    logout: {
      marginBottom: spacing.xl,
    },
  });
}
