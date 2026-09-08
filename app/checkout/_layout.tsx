import { Href, Redirect, Stack, useRouter, useSegments } from "expo-router";
import { Pressable } from "react-native";

import { colors } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import {
  checkoutRecoveryHref,
  hasAddress,
  hasRecipient,
  hasSchedule,
} from "@/src/utils/checkout";

export default function CheckoutLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { cart, loading } = useCart();
  const route = String(segments[segments.length - 1] ?? "");
  const allowEmptyCart = route === "payment" || route === "success";

  if (!loading && (!cart || cart.items.length === 0) && !allowEmptyCart) {
    return <Redirect href={"/(tabs)/cart" as Href} />;
  }

  if (!loading && cart && cart.items.length > 0) {
    const checkout = cart.checkout;
    if (
      (route === "address" ||
        route === "schedule" ||
        route === "summary" ||
        route === "payment") &&
      !hasRecipient(checkout)
    ) {
      return <Redirect href={"/checkout/recipient" as Href} />;
    }
    if (
      (route === "schedule" || route === "summary" || route === "payment") &&
      !hasAddress(checkout)
    ) {
      return <Redirect href={"/checkout/address" as Href} />;
    }
    if (
      (route === "summary" || route === "payment") &&
      !hasSchedule(checkout)
    ) {
      return <Redirect href={checkoutRecoveryHref(checkout) as Href} />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink, fontWeight: "700" },
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={{ paddingHorizontal: 8 }}
          >
            <Typography
              style={{ color: colors.primary, fontWeight: "700" }}
              variant="caption"
            >
              Voltar
            </Typography>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="recipient" options={{ title: "Destinatário" }} />
      <Stack.Screen name="address" options={{ title: "Endereço" }} />
      <Stack.Screen name="schedule" options={{ title: "Data e período" }} />
      <Stack.Screen name="summary" options={{ title: "Resumo" }} />
      <Stack.Screen name="payment" options={{ title: "Pagamento" }} />
      <Stack.Screen
        name="success"
        options={{
          title: "Pedido confirmado",
          headerLeft: () => null,
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
