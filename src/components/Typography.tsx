import { StyleSheet, Text, TextProps } from "react-native";

import { colors, fontFamily, type } from "@/src/components/theme";

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
    fontSize: type.display,
    fontWeight: "700",
    lineHeight: 38,
  },
  title: {
    fontSize: type.title,
    fontWeight: "700",
    lineHeight: 32,
  },
  subtitle: {
    color: colors.muted,
    fontSize: type.subtitle,
    lineHeight: 26,
  },
  body: {
    fontSize: type.body,
    lineHeight: 24,
  },
  caption: {
    color: colors.muted,
    fontSize: type.caption,
    lineHeight: 18,
  },
});
