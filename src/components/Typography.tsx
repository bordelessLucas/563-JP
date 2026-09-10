import { StyleSheet, Text, TextProps } from "react-native";

import {
  colors,
  fontFamily,
  fontFamilyBold,
  fontFamilyDisplay,
  fontFamilyDisplayBold,
  fontFamilyMedium,
  type,
} from "@/src/components/theme";

type TypographyVariant = "display" | "title" | "subtitle" | "body" | "caption";

type TypographyProps = TextProps & {
  variant?: TypographyVariant;
};

export function Typography({
  variant = "body",
  style,
  ...props
}: TypographyProps) {
  return <Text {...props} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: colors.ink,
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
    color: colors.ink,
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
    color: colors.muted,
    fontFamily: fontFamilyMedium,
    fontSize: type.caption,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 17,
  },
});
