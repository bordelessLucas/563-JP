import { Redirect, Slot, useSegments } from "expo-router";

import { useAuth } from "@/src/contexts/AuthContext";

const publicRoutes = new Set(["login", "register", "forgot-password"]);

export function AuthGate() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const route = segments[0];
  const isPublicRoute = typeof route === "string" && publicRoutes.has(route);

  if (loading) return null;
  if (!isAuthenticated && !isPublicRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isPublicRoute) return <Redirect href="/home" />;
  return <Slot />;
}
