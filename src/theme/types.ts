export type ColorSchemeName = "light" | "dark";

/** Preferência do usuário; `system` segue o SO. */
export type ThemePreference = "system" | "light" | "dark";

/**
 * Contrato de cores — light e dark implementam o mesmo shape,
 * mas com objetos totalmente separados (sem merge/herança de cores).
 */
export type ThemeColors = {
  ink: string;
  muted: string;
  canvas: string;
  surface: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  secondary: string;
  border: string;
  accent: string;
  softAccent: string;
  brandBlack: string;
  brandWhite: string;
  success: string;
  successSoft: string;
  whatsapp: string;
  whatsappPressed: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  white: string;
  overlay: string;
  /** Fundo da marca/logo no tema atual */
  logoBackdrop: string;
  /** Borda ao redor da logo */
  logoBorder: string;
};
