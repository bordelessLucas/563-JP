import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import {
  colors,
  fontFamily,
  fontFamilyBold,
  radius,
  spacing,
  type,
} from "@/src/components/theme";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  icon,
  isPassword = false,
  ...props
}: InputProps) {
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon ? <Ionicons color={colors.muted} name={icon} size={18} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          autoCapitalize={props.autoCapitalize ?? "none"}
          placeholderTextColor={props.placeholderTextColor ?? colors.muted}
          secureTextEntry={isPassword && !isPasswordVisible}
          style={styles.input}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={
              isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.eyeHit}
          >
            <Ionicons
              color={colors.muted}
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.ink,
    fontFamily: fontFamilyBold,
    fontSize: type.caption,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: type.body,
    minHeight: 50,
  },
  eyeHit: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  error: {
    color: colors.error,
    fontFamily,
    fontSize: type.caption,
  },
});
