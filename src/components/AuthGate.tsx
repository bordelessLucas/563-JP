import { Redirect, Slot, useSegments } from "expo-router";

import { useAuth } from "@/src/contexts/AuthContext";

const publicRoutes = new Set(["login", "register", "forgot-password"]);

export function AuthGate() {
  const { isAuthenticated, isAdmin, loading, homeRoute } = useAuth();
  const segments = useSegments();
  const route = typeof segments[0] === "string" ? segments[0] : "";
  const isPublicRoute = publicRoutes.has(route);
  const isAdminRoute = route === "admin";
  // Typed routes may lag behind new folders (e.g. order/[id]).
  const isSharedRoute = String(route) === "order";

  if (loading) return null;
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
  return <Slot />;
}
