import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { darkColors } from "@/src/theme/dark";
import { lightColors } from "@/src/theme/light";
import type {
  ColorSchemeName,
  ThemeColors,
  ThemePreference,
} from "@/src/theme/types";

const STORAGE_KEY = "chuva_theme_preference_v1";

export type AppTheme = {
  /** Preferência do usuário (sistema / claro / escuro) */
  preference: ThemePreference;
  /** Esquema efetivo após resolver preferência + sistema */
  scheme: ColorSchemeName;
  colors: ThemeColors;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<AppTheme | null>(null);

function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorSchemeName {
  if (preference === "light" || preference === "dark") return preference;
  return system === "dark" ? "dark" : "light";
}

function applyNativeScheme(preference: ThemePreference) {
  // Android crasha com null — usar "unspecified" para voltar ao SO.
  Appearance.setColorScheme(
    preference === "system" ? "unspecified" : preference,
  );
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        }
      } catch {
        // mantém system
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyNativeScheme(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // ignore
    });
  }, []);

  useEffect(() => {
    applyNativeScheme(preference);
  }, [preference]);

  const scheme = resolveScheme(preference, system);

  const value = useMemo<AppTheme>(
    () => ({
      preference,
      scheme,
      // Paletas totalmente separadas — sem Object.assign / merge.
      colors: scheme === "dark" ? darkColors : lightColors,
      isDark: scheme === "dark",
      setPreference,
    }),
    [preference, scheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }
  return ctx;
}
