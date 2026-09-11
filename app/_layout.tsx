import { StatusBar } from "expo-status-bar";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import "react-native-reanimated";

import { AuthGate } from "@/src/components/AuthGate";
import { fontFamilyBold } from "@/src/components/theme";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { CartProvider } from "@/src/contexts/CartContext";
import {
  AppThemeProvider,
  useTheme,
} from "@/src/contexts/ThemeContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? NavDarkTheme : DefaultTheme),
      dark: isDark,
      colors: {
        ...(isDark ? NavDarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.canvas,
        card: colors.canvas,
        text: colors.ink,
        border: colors.border,
        notification: colors.primary,
      },
    }),
    [colors, isDark],
  );

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <AuthGate>
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.canvas },
                headerTintColor: colors.ink,
                headerTitleStyle: {
                  color: colors.ink,
                  fontFamily: fontFamilyBold,
                  fontWeight: "700",
                },
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen
                name="forgot-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{ title: "Acompanhar pedido" }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="+not-found"
                options={{ title: "Não encontrado" }}
              />
            </Stack>
          </AuthGate>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
