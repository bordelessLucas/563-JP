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
  const [continuing, setContinuing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
    setActionError(null);
    try {
      await setItemQuantity(productId, quantity - 1);
    } catch {
      setActionError("Não foi possível atualizar a quantidade.");
    } finally {
      setSavingId(null);
    }
  };

  const handleIncrease = async (productId: string, quantity: number) => {
    setSavingId(productId);
    setActionError(null);
    try {
      await setItemQuantity(productId, quantity + 1);
    } catch {
      setActionError("Não foi possível atualizar a quantidade.");
    } finally {
      setSavingId(null);
    }
  };

  const handleContinue = async () => {
    if (!cart || continuing) return;
    setContinuing(true);
    setActionError(null);
    try {
      for (const item of cart.items) {
        const draft = messageDrafts[item.productId] ?? item.message;
        if (draft !== item.message) {
          await setItemMessage(item.productId, draft);
        }
      }
      router.push("/checkout/recipient" as Href);
    } catch {
      setActionError(
        "Não foi possível salvar as mensagens. Tente de novo.",
      );
    } finally {
      setContinuing(false);
    }
  };

  const items = cart?.items ?? [];

  return (
    <Container onRefresh={onRefresh} refreshing={loading && items.length > 0} scroll>
      <Typography style={styles.eyebrow} variant="caption">
        Carrinho
      </Typography>
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
        <View style={styles.content}>
          <InlineNotice
            description="Inclua uma mensagem por item, se quiser. Seus dados ficam salvos entre as etapas."
            title="Personalize seu pedido"
            tone="info"
          />

          {actionError ? (
            <InlineNotice
              description={actionError}
              title="Algo deu errado"
              tone="error"
            />
          ) : null}

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
                    accessibilityRole="button"
                    hitSlop={8}
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
                    style={styles.removeHit}
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
            <View style={styles.feeBlock}>
              <View style={styles.summaryRow}>
                <Typography variant="caption">Frete</Typography>
                <Typography variant="body">
                  {formatCurrency(cart?.deliveryFee ?? 0)}
                </Typography>
              </View>
              <Typography style={styles.feeHint} variant="caption">
                Estimativa só para referência. O frete cobrado é cotado no
                resumo/pagamento pelo servidor — não use este valor como cobrança.
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
            loading={continuing}
            onPress={() => {
              void handleContinue();
            }}
          />
        </View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  image: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    height: 92,
    width: 92,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
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
  removeHit: {
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feeBlock: {
    gap: spacing.xs,
  },
  feeHint: {
    color: colors.muted,
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
