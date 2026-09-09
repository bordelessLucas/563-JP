// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/**",
      "functions/**",
      ".expo/**",
      "node_modules/**",
      "components/__tests__/**",
      "components/EditScreenInfo.tsx",
      "components/useClientOnlyValue.web.ts",
    ],
  },
  {
    rules: {
      // Pre-existing Expo/app data-loading patterns; keep as warning so lint is usable.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/array-type": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
]);
