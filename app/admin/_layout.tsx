import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { colors } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

export default function AdminLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink, fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="orders"
        options={{
          title: "Pedidos",
          headerLeft: () => (
            <Pressable
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
      />
      <Stack.Screen
        name="products"
        options={{
          title: "Produtos",
          headerLeft: () => (
            <Pressable
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
      />
      <Stack.Screen
        name="categories"
        options={{
          title: "Categorias",
          headerLeft: () => (
            <Pressable
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
      />
      <Stack.Screen
        name="promotions"
        options={{
          title: "Promoções",
          headerLeft: () => (
            <Pressable
              hitSlop={8}
              onPress={() => router.back()}
              style={{ paddingHorizontal: 8, minHeight: 44, justifyContent: "center" }}
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
      />
    </Stack>
  );
}
