import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import {
  colors,
  fontFamilyBold,
  radius,
  spacing,
} from "@/src/components/theme";

type ButtonVariant = "primary" | "secondary" | "outline";

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
  const isDisabled = disabled || loading;
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";

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
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && !isOutline && !isSecondary && styles.primaryPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.label,
            isSecondary && styles.secondaryLabel,
            isOutline && styles.outlineLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.92,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  label: {
    color: colors.white,
    fontFamily: fontFamilyBold,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  outlineLabel: {
    color: colors.primary,
  },
});
