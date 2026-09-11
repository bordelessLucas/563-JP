import { useMemo } from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import {
  fontFamily,
  fontFamilyDisplay,
  fontFamilyDisplayBold,
  fontFamilyMedium,
  type,
} from "@/src/components/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

type TypographyVariant = "display" | "title" | "subtitle" | "body" | "caption";

type TypographyProps = TextProps & {
  variant?: TypographyVariant;
};

export function Typography({
  variant = "body",
  style,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text {...props} style={[styles.base, styles[variant], style]} />;
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    base: {
      color: palette.ink,
      fontFamily,
    },
    display: {
      fontFamily: fontFamilyDisplayBold,
      fontSize: type.display,
      fontWeight: "700",
      letterSpacing: -0.4,
      lineHeight: 40,
    },
    title: {
      fontFamily: fontFamilyDisplay,
      fontSize: type.title,
      fontWeight: "600",
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    subtitle: {
      color: palette.ink,
      fontFamily: fontFamilyMedium,
      fontSize: type.subtitle,
      fontWeight: "500",
      lineHeight: 24,
    },
    body: {
      fontFamily,
      fontSize: type.body,
      lineHeight: 24,
    },
    caption: {
      color: palette.muted,
      fontFamily: fontFamilyMedium,
      fontSize: type.caption,
      fontWeight: "500",
      letterSpacing: 0.15,
      lineHeight: 17,
    },
  });
}
