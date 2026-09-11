import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { fontFamilyBold, radius, spacing } from "@/src/components/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

type ButtonVariant = "primary" | "secondary" | "outline" | "dark" | "whatsapp";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isDisabled = disabled || loading;
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";
  const isDark = variant === "dark";
  const isWhatsapp = variant === "whatsapp";

  const spinnerColor =
    isOutline || isSecondary
      ? colors.ink
      : isDark
        ? colors.primary
        : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isDark && styles.dark,
        isWhatsapp && styles.whatsapp,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && variant === "primary" && styles.primaryPressed,
        pressed && !isDisabled && isDark && styles.darkPressed,
        pressed && !isDisabled && isWhatsapp && styles.whatsappPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.label,
            isSecondary && styles.secondaryLabel,
            isOutline && styles.outlineLabel,
            isDark && styles.darkLabel,
            isWhatsapp && styles.whatsappLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    button: {
      alignItems: "center",
      backgroundColor: palette.primary,
      borderRadius: radius.md,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: spacing.lg,
    },
    secondary: {
      backgroundColor: palette.secondary,
    },
    outline: {
      backgroundColor: palette.canvas,
      borderColor: palette.ink,
      borderWidth: 1.5,
    },
    dark: {
      backgroundColor: palette.brandBlack,
    },
    whatsapp: {
      backgroundColor: palette.whatsapp,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.92,
    },
    primaryPressed: {
      backgroundColor: palette.primaryPressed,
    },
    darkPressed: {
      opacity: 0.88,
    },
    whatsappPressed: {
      backgroundColor: palette.whatsappPressed,
    },
    label: {
      color: palette.onPrimary,
      fontFamily: fontFamilyBold,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    secondaryLabel: {
      color: palette.ink,
    },
    outlineLabel: {
      color: palette.ink,
    },
    darkLabel: {
      color: palette.primary,
    },
    whatsappLabel: {
      color: palette.white,
    },
  });
}
