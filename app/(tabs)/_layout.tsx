import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ColorValue, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontFamilyMedium } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";

function CartTabIcon({
  color,
  focused,
  size,
}: {
  color: ColorValue;
  focused: boolean;
  size: number;
}) {
  const { itemCount } = useCart();

  return (
    <View>
      <Ionicons
        color={color}
        name={focused ? "cart" : "cart-outline"}
        size={size}
      />
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <Typography style={styles.badgeLabel} variant="caption">
            {itemCount > 9 ? "9+" : String(itemCount)}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontFamily: fontFamilyMedium,
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "grid" : "grid-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, focused, size }) => (
            <CartTabIcon color={color} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "receipt" : "receipt-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? "person" : "person-outline"}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -10,
    top: -4,
  },
  badgeLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 12,
  },
});
