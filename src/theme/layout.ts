import { Platform } from "react-native";

/**
 * Tokens de layout compartilhados (sem cores).
 * Light e dark não compartilham paleta — só espaçamento/tipo/forma.
 */
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const type = {
  display: 34,
  title: 26,
  subtitle: 17,
  body: 16,
  caption: 12,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const touchTarget = 44;

export const fontFamilyDisplay = "CormorantGaramond_600SemiBold";
export const fontFamilyDisplayBold = "CormorantGaramond_700Bold";
export const fontFamily = "DMSans_400Regular";
export const fontFamilyMedium = "DMSans_500Medium";
export const fontFamilyBold = "DMSans_700Bold";

export const fontFamilyFallback = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});
