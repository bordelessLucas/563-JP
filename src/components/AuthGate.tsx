import { Redirect, useSegments } from "expo-router";
import { PropsWithChildren, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { LoadingState } from "@/src/components/LoadingState";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";

const publicRoutes = new Set(["login", "register", "forgot-password", "index"]);

export function AuthGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          backgroundColor: colors.canvas,
          flex: 1,
          justifyContent: "center",
        },
      }),
    [colors.canvas],
  );
  const { isAuthenticated, isAdmin, loading, homeRoute } = useAuth();
  const segments = useSegments();
  const route = typeof segments[0] === "string" ? segments[0] : "";
  const isPublicRoute = publicRoutes.has(route);
  const isAdminRoute = route === "admin";
  const isSharedRoute = String(route) === "order";

  if (loading) {
    return (
      <View style={styles.loading}>
        <LoadingState label="Preparando sua conta…" />
      </View>
    );
  }
  if (!isAuthenticated && !isPublicRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isPublicRoute) return <Redirect href={homeRoute} />;
  if (isAuthenticated && isAdminRoute && !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }
  if (
    isAuthenticated &&
    isAdmin &&
    !isAdminRoute &&
    !isPublicRoute &&
    !isSharedRoute
  ) {
    return <Redirect href="/admin" />;
  }
  return children;
}
