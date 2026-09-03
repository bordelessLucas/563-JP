import { Platform } from "react-native";

export const colors = {
  ink: "#263238",
  muted: "#69777A",
  canvas: "#F8F7F3",
  surface: "#FFFFFF",
  primary: "#315C54",
  primaryPressed: "#23483F",
  secondary: "#E8EFE8",
  border: "#D8E0DB",
  error: "#B23A48",
  white: "#FFFFFF",
  accent: "#D98268",
  softAccent: "#F4E1D8",
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

export const fontFamily = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});
