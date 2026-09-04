import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { EmptyState } from "@/src/components/EmptyState";
import { ImageGallery } from "@/src/components/ImageGallery";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { StockBadge } from "@/src/components/StockBadge";
import {
  colors,
  fontFamily,
  radius,
  spacing,
  type,
} from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import { listActiveCategories } from "@/src/services/category.service";
import { getProductById } from "@/src/services/product.service";
import { Product } from "@/src/types/catalog";
import { formatCurrency } from "@/src/utils/format";

export function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setQuantity(1);
    setMessage("");
    setAdded(false);

    const load = async () => {
      if (!id) {
        setError("Produto inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [nextProduct, categories] = await Promise.all([
          getProductById(id),
          listActiveCategories(),
        ]);
        if (!active) return;
        if (!nextProduct) {
          setError("Produto não encontrado ou indisponível.");
          setProduct(null);
          return;
        }
        setProduct(nextProduct);
        setCategoryName(
          categories.find((category) => category.id === nextProduct.categoryId)
            ?.name ?? "",
        );
      } catch {
        if (active) setError("Não foi possível carregar o produto.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const unavailable = product?.stockStatus === "out_of_stock";
  const unitPrice = product?.price ?? 0;
  const totalPreview = unitPrice * quantity;

  const handleAddToCart = async () => {
    if (!product || unavailable) return;
    setSaving(true);
    try {
      await addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        quantity,
        unitPrice: product.price,
        message,
      });
      setAdded(true);
    } catch {
      setError("Não foi possível adicionar ao carrinho.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
      >
        <Ionicons color={colors.ink} name="chevron-back" size={22} />
      </Pressable>

      {loading ? (
        <Container>
          <LoadingState label="Carregando produto..." />
        </Container>
      ) : null}

      {!loading && (error || !product) ? (
        <Container>
          <EmptyState
            actionLabel="Voltar ao catálogo"
            description={error ?? "Tente outro item do catálogo."}
            icon="alert-circle-outline"
            onAction={() => router.replace("/(tabs)/catalog")}
            title="Produto indisponível"
          />
        </Container>
      ) : null}

      {!loading && product ? (
        <>
          <Container scroll>
            <View style={styles.galleryWrap}>
              <ImageGallery images={product.images} />
            </View>

            <View style={styles.content}>
              {categoryName ? (
                <Typography variant="caption">{categoryName}</Typography>
              ) : null}
              <Typography variant="title">{product.name}</Typography>
              <Typography style={styles.price} variant="display">
                {formatCurrency(product.price)}
              </Typography>
              <StockBadge status={product.stockStatus} />

              <Typography style={styles.sectionLabel} variant="caption">
                O que você recebe
              </Typography>
              <Typography style={styles.description} variant="body">
                {product.description}
              </Typography>

              <Typography style={styles.sectionLabel} variant="caption">
                Quantidade
              </Typography>
              <View style={styles.quantityRow}>
                <Pressable
                  accessibilityLabel="Diminuir quantidade"
                  disabled={quantity <= 1 || unavailable}
                  onPress={() => setQuantity((value) => Math.max(1, value - 1))}
                  style={[
                    styles.qtyButton,
                    (quantity <= 1 || unavailable) && styles.qtyDisabled,
                  ]}
                >
                  <Ionicons color={colors.primary} name="remove" size={18} />
                </Pressable>
                <Typography style={styles.qtyValue} variant="subtitle">
                  {quantity}
                </Typography>
                <Pressable
                  accessibilityLabel="Aumentar quantidade"
                  disabled={unavailable}
                  onPress={() => setQuantity((value) => value + 1)}
                  style={[styles.qtyButton, unavailable && styles.qtyDisabled]}
                >
                  <Ionicons color={colors.primary} name="add" size={18} />
                </Pressable>
                <Typography style={styles.qtyHint} variant="caption">
                  Subtotal {formatCurrency(totalPreview)}
                </Typography>
              </View>

              <Typography style={styles.sectionLabel} variant="caption">
                Mensagem personalizada (opcional)
              </Typography>
              <TextInput
                editable={!unavailable}
                multiline
                onChangeText={setMessage}
                placeholder="Ex.: Feliz aniversário! Com carinho..."
                placeholderTextColor={colors.muted}
                style={styles.messageInput}
                value={message}
              />

              {added ? (
                <InlineNotice
                  description="Você já pode revisar quantidades, editar a mensagem e seguir para a entrega."
                  title="Adicionado ao carrinho"
                  tone="success"
                />
              ) : (
                <InlineNotice
                  description="Escolha a quantidade, inclua uma mensagem se quiser e adicione ao pedido."
                  title="Monte seu pedido"
                  tone="info"
                />
              )}

              <View style={styles.bottomSpacer} />
            </View>
          </Container>

          <View
            style={[
              styles.ctaBar,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
          >
            <View style={styles.ctaCopy}>
              <Typography variant="caption">Total estimado</Typography>
              <Typography style={styles.ctaPrice} variant="subtitle">
                {formatCurrency(totalPreview)}
              </Typography>
            </View>
            {added ? (
              <View style={styles.ctaActions}>
                <Button
                  label="Ver carrinho"
                  onPress={() => router.push("/(tabs)/cart")}
                />
                <Button
                  label="Continuar comprando"
                  onPress={() => router.replace("/(tabs)/catalog")}
                  variant="outline"
                />
              </View>
            ) : (
              <Button
                disabled={unavailable}
                label={unavailable ? "Indisponível" : "Adicionar ao carrinho"}
                loading={saving}
                onPress={() => {
                  void handleAddToCart();
                }}
              />
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    elevation: 2,
    height: 44,
    justifyContent: "center",
    left: spacing.lg,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    width: 44,
    zIndex: 2,
  },
  galleryWrap: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
  },
  content: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  price: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
  },
  sectionLabel: {
    fontWeight: "700",
    marginTop: spacing.md,
  },
  description: {
    color: colors.ink,
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  qtyButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  qtyDisabled: {
    opacity: 0.4,
  },
  qtyValue: {
    color: colors.ink,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  qtyHint: {
    color: colors.muted,
  },
  messageInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily,
    fontSize: type.body,
    minHeight: 88,
    padding: spacing.md,
    textAlignVertical: "top",
  },
  bottomSpacer: {
    height: 160,
  },
  ctaBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  ctaCopy: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ctaPrice: {
    color: colors.primary,
    fontWeight: "700",
  },
  ctaActions: {
    gap: spacing.sm,
    width: "100%",
  },
});
