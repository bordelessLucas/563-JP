import { Redirect } from "expo-router";

/** Template Expo isolado — redireciona para a home do cliente. */
export default function ModalScreen() {
  return <Redirect href="/(tabs)" />;
}
