import { PropsWithChildren } from "react";
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

import { colors, spacing } from "@/src/components/theme";

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
    <SafeAreaView {...props} edges={["top", "left", "right"]} style={[styles.safeArea, style]}>
      {keyboardContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.canvas,
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
