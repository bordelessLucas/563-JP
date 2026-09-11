/**
 * Compat: tokens de layout + reexports.
 * Cores dinâmicas: use `useTheme()` de `@/src/contexts/ThemeContext`.
 * Nunca misturar lightColors com darkColors.
 */
export {
  fontFamily,
  fontFamilyBold,
  fontFamilyDisplay,
  fontFamilyDisplayBold,
  fontFamilyFallback,
  fontFamilyMedium,
  radius,
  spacing,
  touchTarget,
  type,
} from "@/src/theme/layout";

export { lightColors } from "@/src/theme/light";
export { darkColors } from "@/src/theme/dark";
export type { ThemeColors, ColorSchemeName, ThemePreference } from "@/src/theme/types";

/**
 * @deprecated Use `useTheme().colors` para respeitar dark/light do sistema.
 * Mantido só como fallback light para imports legados em StyleSheet estático.
 */
export { lightColors as colors } from "@/src/theme/light";
