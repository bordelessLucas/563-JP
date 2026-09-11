import { PropsWithChildren, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "@/src/components/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

type ContainerProps = PropsWithChildren<ViewProps> & {
  scroll?: boolean;
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
};

export function Container({
  children,
  scroll = false,
  keyboardAware = false,
  refreshing = false,
  onRefresh,
  padded = true,
  style,
  ...props
}: ContainerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        !padded && styles.noPadding,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, !padded && styles.noPadding]}>{children}</View>
  );

  const keyboardContent = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      {...props}
      edges={["top", "left", "right"]}
      style={[styles.safeArea, style]}
    >
      {keyboardContent}
    </SafeAreaView>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: palette.canvas,
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    noPadding: {
      padding: 0,
    },
  });
}
