import { Platform } from "react-native";

/**
 * Design system provisório (MVP).
 * Fonte de verdade documental: docs-ia/design_system.md
 * Substituir quando a floricultura enviar identidade oficial.
 */
export const colors = {
  ink: "#1C2B26",
  muted: "#5F6F68",
  canvas: "#F5F7F6",
  surface: "#FFFFFF",
  primary: "#1F4D3A",
  primaryPressed: "#16382B",
  secondary: "#E3EDE8",
  border: "#D0DCD5",
  accent: "#C45B7A",
  softAccent: "#F7E8EE",
  success: "#2F7D57",
  warning: "#C48A2A",
  error: "#B33A45",
  white: "#FFFFFF",
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
  display: 32,
  title: 25,
  subtitle: 18,
  body: 16,
  caption: 13,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
};

export const touchTarget = 44;

export const fontFamily = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});
