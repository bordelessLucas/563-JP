import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, fontFamily, radius, spacing, type } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import { formatCurrency } from "@/src/utils/format";

export function CartScreen() {
  const router = useRouter();
  const {
    cart,
    loading,
    refreshCart,
    setItemQuantity,
    setItemMessage,
    removeItem,
  } = useCart();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const item of cart?.items ?? []) {
      nextDrafts[item.productId] = item.message;
    }
    setMessageDrafts(nextDrafts);
  }, [cart?.items]);

  const onRefresh = useCallback(() => {
    void refreshCart();
  }, [refreshCart]);

  const handleDecrease = async (productId: string, quantity: number) => {
    if (quantity <= 1) {
      Alert.alert("Remover item", "Deseja remover este item do carrinho?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            void removeItem(productId);
          },
        },
      ]);
      return;
    }

    setSavingId(productId);
    try {
      await setItemQuantity(productId, quantity - 1);
    } finally {
      setSavingId(null);
    }
  };

  const handleIncrease = async (productId: string, quantity: number) => {
    setSavingId(productId);
    try {
      await setItemQuantity(productId, quantity + 1);
    } finally {
      setSavingId(null);
    }
  };

  const items = cart?.items ?? [];

  return (
    <Container onRefresh={onRefresh} refreshing={loading && items.length > 0} scroll>
      <Typography variant="caption">CARRINHO</Typography>
      <Typography style={styles.title} variant="title">
        Seu pedido
      </Typography>

      {loading && items.length === 0 ? (
        <LoadingState label="Carregando carrinho..." />
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          actionLabel="Explorar catálogo"
          description="Adicione flores e presentes para personalizar e seguir para a entrega."
          icon="cart-outline"
          onAction={() => router.push("/(tabs)/catalog")}
          title="Carrinho vazio"
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <InlineNotice
            description="Inclua uma mensagem por item se quiser. Seus dados ficam salvos entre as etapas."
            title="Personalize antes de continuar"
            tone="info"
          />

          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.productId} style={styles.card}>
                {item.productImage ? (
                  <Image source={{ uri: item.productImage }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]} />
                )}
                <View style={styles.cardBody}>
                  <Typography numberOfLines={2} style={styles.name} variant="body">
                    {item.productName}
                  </Typography>
                  <Typography style={styles.price} variant="caption">
                    {formatCurrency(item.unitPrice)} cada
                  </Typography>

                  <View style={styles.qtyRow}>
                    <Pressable
                      accessibilityLabel="Diminuir quantidade"
                      disabled={savingId === item.productId}
                      onPress={() =>
                        void handleDecrease(item.productId, item.quantity)
                      }
                      style={styles.qtyButton}
                    >
                      <Ionicons color={colors.primary} name="remove" size={16} />
                    </Pressable>
                    <Typography style={styles.qtyValue} variant="body">
                      {item.quantity}
                    </Typography>
                    <Pressable
                      accessibilityLabel="Aumentar quantidade"
                      disabled={savingId === item.productId}
                      onPress={() =>
                        void handleIncrease(item.productId, item.quantity)
                      }
                      style={styles.qtyButton}
                    >
                      <Ionicons color={colors.primary} name="add" size={16} />
                    </Pressable>
                    <Typography style={styles.lineTotal} variant="caption">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </Typography>
                  </View>

                  <Typography style={styles.messageLabel} variant="caption">
                    Mensagem personalizada
                  </Typography>
                  <TextInput
                    multiline
                    onBlur={() => {
                      void setItemMessage(
                        item.productId,
                        messageDrafts[item.productId] ?? "",
                      );
                    }}
                    onChangeText={(text) => {
                      setMessageDrafts((current) => ({
                        ...current,
                        [item.productId]: text,
                      }));
                    }}
                    placeholder="Ex.: Feliz aniversário! Com carinho..."
                    placeholderTextColor={colors.muted}
                    style={styles.messageInput}
                    value={messageDrafts[item.productId] ?? item.message}
                  />

                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Remover item",
                        `Remover ${item.productName} do carrinho?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Remover",
                            style: "destructive",
                            onPress: () => {
                              void removeItem(item.productId);
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Typography style={styles.remove} variant="caption">
                      Remover
                    </Typography>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Typography variant="caption">Subtotal</Typography>
              <Typography variant="body">
                {formatCurrency(cart?.subtotal ?? 0)}
              </Typography>
            </View>
            <View style={styles.summaryRow}>
              <Typography variant="caption">Entrega (estimada)</Typography>
              <Typography variant="body">
                {formatCurrency(cart?.deliveryFee ?? 0)}
              </Typography>
            </View>
            <View style={styles.summaryRow}>
              <Typography style={styles.totalLabel} variant="subtitle">
                Total
              </Typography>
              <Typography style={styles.totalValue} variant="subtitle">
                {formatCurrency(cart?.total ?? 0)}
              </Typography>
            </View>
          </View>

          <Button
            label="Continuar para entrega"
            onPress={() => router.push("/checkout/recipient" as Href)}
          />
        </>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.sm,
  },
  image: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    height: 96,
    width: 96,
  },
  imageFallback: {
    backgroundColor: colors.softAccent,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontWeight: "700",
  },
  price: {
    color: colors.muted,
  },
  qtyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  qtyButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  qtyValue: {
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  lineTotal: {
    color: colors.primary,
    fontWeight: "700",
    marginLeft: "auto",
  },
  messageLabel: {
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  messageInput: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily,
    fontSize: type.caption,
    minHeight: 64,
    padding: spacing.sm,
    textAlignVertical: "top",
  },
  remove: {
    color: colors.error,
    fontWeight: "700",
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  totalValue: {
    color: colors.primary,
    fontWeight: "700",
  },
});
