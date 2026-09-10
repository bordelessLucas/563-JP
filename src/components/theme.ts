import { Platform } from "react-native";

/**
 * Design system provisório — floricultura refinada (botânico / clean).
 * Fonte de verdade: docs-ia/design_system.md
 */
export const colors = {
  ink: "#1A2A24",
  muted: "#6A7A73",
  canvas: "#F3F6F4",
  surface: "#FFFFFF",
  primary: "#1F4D3A",
  primaryPressed: "#16382B",
  secondary: "#E6EFEA",
  border: "#D5E0DA",
  accent: "#C45B7A",
  softAccent: "#F7E8EE",
  success: "#2F7D57",
  successSoft: "#E7F4EE",
  warning: "#C48A2A",
  warningSoft: "#F8F0DE",
  error: "#B33A45",
  errorSoft: "#F8E8EA",
  white: "#FFFFFF",
  overlay: "rgba(26, 42, 36, 0.42)",
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const type = {
  display: 34,
  title: 26,
  subtitle: 17,
  body: 16,
  caption: 12,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
};

export const touchTarget = 44;

/** Display / títulos — Cormorant Garamond (carregada em app/_layout). */
export const fontFamilyDisplay = "CormorantGaramond_600SemiBold";
export const fontFamilyDisplayBold = "CormorantGaramond_700Bold";

/** Corpo / UI — DM Sans. */
export const fontFamily = "DMSans_400Regular";
export const fontFamilyMedium = "DMSans_500Medium";
export const fontFamilyBold = "DMSans_700Bold";

/** Fallback se fontes ainda não carregaram. */
export const fontFamilyFallback = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});

export const elevation = {
  /** Preferir borda; sombra mínima só em overlays flutuantes. */
  soft: {
    shadowColor: "#1A2A24",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
};
