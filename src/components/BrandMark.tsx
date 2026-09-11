import { Image } from "react-native";

import { radius } from "@/src/components/theme";
import { brand } from "@/src/constants/brand";
import { useTheme } from "@/src/contexts/ThemeContext";

type BrandMarkProps = {
  /** Lado do quadrado da logo (altura no variant hero) */
  size?: number;
  /**
   * `badge` — marca quadrada (login, perfil).
   * `hero` — logo um pouco mais larga (home).
   */
  variant?: "badge" | "hero";
};

/**
 * Sem “caixa” em volta: a imagem é a marca.
 * No light, borda fina preta cola na própria logo para contraste.
 * No dark, sem borda (fundo preto da arte já contrasta).
 */
export function BrandMark({ size = 72, variant = "badge" }: BrandMarkProps) {
  const { colors, isDark } = useTheme();
  const source = isDark ? brand.logoDark : brand.logoLight;
  const height = size;
  const width = variant === "hero" ? Math.round(size * 1.35) : size;
  const corner = variant === "hero" ? radius.md : radius.lg;

  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel={brand.fullName}
      resizeMode="contain"
      source={source}
      style={{
        width,
        height,
        borderRadius: corner,
        backgroundColor: colors.logoBackdrop,
        borderWidth: isDark ? 0 : 1,
        borderColor: isDark ? "transparent" : colors.ink,
        overflow: "hidden",
      }}
    />
  );
}
