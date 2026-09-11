import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { LoadingState } from "@/src/components/LoadingState";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import { listAllCategories } from "@/src/services/category.service";
import {
  createProduct,
  listAllProducts,
  updateProduct,
} from "@/src/services/product.service";
import type { ThemeColors } from "@/src/theme/types";
import { Category, Product, stockStatusFromQuantity } from "@/src/types/catalog";
import { formatCurrency, stockLabel } from "@/src/utils/format";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80";

type FormState = {
  name: string;
  price: string;
  promoPrice: string;
  quantity: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  featured: boolean;
  promo: boolean;
  active: boolean;
};

const emptyForm = (categoryId = ""): FormState => ({
  name: "",
  price: "",
  promoPrice: "",
  quantity: "10",
  description: "",
  categoryId,
  imageUrl: DEFAULT_IMAGE,
  featured: false,
  promo: false,
  active: true,
});

export default function AdminProductsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        listAllProducts(),
        listAllCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || nextCategories[0]?.id || "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar produtos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  function patchForm(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm(categories[0]?.id || ""));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price).replace(".", ","),
      promoPrice:
        product.promoPrice != null
          ? String(product.promoPrice).replace(".", ",")
          : "",
      quantity: String(product.stockQuantity),
      description: product.description,
      categoryId: product.categoryId,
      imageUrl: product.images[0] || DEFAULT_IMAGE,
      featured: product.featured,
      promo: product.promo,
      active: product.active,
    });
  }

  async function handleSave() {
    const parsedPrice = Number(form.price.replace(",", "."));
    const parsedQty = Number(form.quantity.replace(",", "."));
    const parsedPromoPrice = form.promoPrice.trim()
      ? Number(form.promoPrice.replace(",", "."))
      : null;
    if (!form.name.trim() || !form.categoryId || Number.isNaN(parsedPrice)) {
      Alert.alert("Campos obrigatórios", "Informe nome, categoria e preço.");
      return;
    }
    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      Alert.alert("Quantidade inválida", "Informe a quantidade em estoque (≥ 0).");
      return;
    }
    if (
      form.promo &&
      (parsedPromoPrice === null ||
        Number.isNaN(parsedPromoPrice) ||
        parsedPromoPrice <= 0)
    ) {
      Alert.alert(
        "Preço promocional",
        "Informe um preço promocional válido maior que zero.",
      );
      return;
    }

    const stockQuantity = Math.floor(parsedQty);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || "Produto da loja.",
      categoryId: form.categoryId,
      price: parsedPrice,
      images: [form.imageUrl.trim() || DEFAULT_IMAGE],
      active: form.active,
      featured: form.featured,
      promo: form.promo,
      promoPrice: form.promo ? parsedPromoPrice : null,
      stockQuantity,
      stockStatus: stockStatusFromQuantity(stockQuantity),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        Alert.alert("Produto atualizado", "Alterações salvas no catálogo.");
      } else {
        await createProduct(payload);
        Alert.alert("Produto criado", "Já aparece no catálogo se estiver ativo.");
      }
      startCreate();
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao salvar produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    try {
      await updateProduct(product.id, { active: !product.active });
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao atualizar.",
      );
    }
  }

  if (loading) {
    return (
      <Container>
        <LoadingState label="Carregando catálogo…" />
      </Container>
    );
  }

  return (
    <Container scroll>
      <Typography variant="caption">ADMIN · PRODUTOS</Typography>
      <Typography style={styles.title} variant="title">
        {editingId ? "Editar produto" : "Novo produto"}
      </Typography>
      <InlineNotice
        description="Ajuste preço, promoção, quantidade, destaque e foto (URL). Itens em promoção aparecem com destaque no catálogo."
        title="Catálogo da loja"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input
          autoCapitalize="sentences"
          label="Nome"
          onChangeText={(name) => patchForm({ name })}
          value={form.name}
        />
        <View style={styles.rowFields}>
          <View style={styles.half}>
            <Input
              keyboardType="decimal-pad"
              label="Preço (R$)"
              onChangeText={(price) => patchForm({ price })}
              value={form.price}
            />
          </View>
          <View style={styles.half}>
            <Input
              keyboardType="number-pad"
              label="Quantidade"
              onChangeText={(quantity) => patchForm({ quantity })}
              value={form.quantity}
            />
          </View>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Typography variant="body">Em promoção</Typography>
            <Typography variant="caption">
              Destaca no catálogo e no filtro Promoção
            </Typography>
          </View>
          <Switch
            onValueChange={(promo) => patchForm({ promo })}
            trackColor={{ true: colors.accent, false: colors.border }}
            value={form.promo}
          />
        </View>
        {form.promo ? (
          <Input
            keyboardType="decimal-pad"
            label="Preço promocional (R$)"
            onChangeText={(promoPrice) => patchForm({ promoPrice })}
            value={form.promoPrice}
          />
        ) : null}
        <Input
          autoCapitalize="sentences"
          label="Descrição"
          onChangeText={(description) => patchForm({ description })}
          value={form.description}
        />
        <Input
          autoCapitalize="none"
          label="URL da imagem"
          onChangeText={(imageUrl) => patchForm({ imageUrl })}
          value={form.imageUrl}
        />
        <Typography variant="caption">Categoria</Typography>
        <View style={styles.chips}>
          {categories.map((category) => {
            const selected = form.categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => patchForm({ categoryId: category.id })}
                style={[styles.chip, selected && styles.chipOn]}
              >
                <Typography
                  style={[styles.chipLabel, selected && styles.chipLabelOn]}
                  variant="caption"
                >
                  {category.name}
                </Typography>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.switchRow}>
          <Typography variant="body">Destaque na home</Typography>
          <Switch
            onValueChange={(featured) => patchForm({ featured })}
            trackColor={{ true: colors.primary, false: colors.border }}
            value={form.featured}
          />
        </View>
        <View style={styles.switchRow}>
          <Typography variant="body">Ativo no catálogo</Typography>
          <Switch
            onValueChange={(active) => patchForm({ active })}
            trackColor={{ true: colors.primary, false: colors.border }}
            value={form.active}
          />
        </View>

        <Button
          label={editingId ? "Salvar alterações" : "Criar produto"}
          loading={saving}
          onPress={() => void handleSave()}
        />
        {editingId ? (
          <Button
            label="Cancelar edição"
            onPress={startCreate}
            variant="outline"
          />
        ) : null}
      </View>

      <Typography style={styles.section} variant="subtitle">
        Lista ({products.length})
      </Typography>
      <View style={styles.list}>
        {products.map((product) => (
          <View key={product.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Typography style={styles.name} variant="body">
                  {product.name}
                </Typography>
                <Typography variant="caption">
                  {formatCurrency(product.price)}
                  {product.promo && product.promoPrice != null
                    ? ` → ${formatCurrency(product.promoPrice)}`
                    : ""}{" "}
                  · {product.stockQuantity} un. · {stockLabel(product.stockStatus)}
                  {product.featured ? " · Destaque" : ""}
                  {product.promo ? " · Promo" : ""}
                </Typography>
                <Typography variant="caption">
                  {product.active ? "Ativo" : "Inativo"}
                </Typography>
              </View>
              <Switch
                onValueChange={() => void toggleActive(product)}
                trackColor={{ true: colors.primary, false: colors.border }}
                value={product.active}
              />
            </View>
            <Button
              label="Editar"
              onPress={() => startEdit(product)}
              variant="secondary"
            />
          </View>
        ))}
      </View>
    </Container>
  );
}

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    title: {
      marginBottom: spacing.md,
    },
    form: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    rowFields: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    half: {
      flex: 1,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.md,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipOn: {
      backgroundColor: palette.secondary,
      borderColor: palette.primary,
    },
    chipLabel: {
      fontWeight: "700",
    },
    chipLabelOn: {
      color: palette.primary,
    },
    switchRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 44,
    },
    switchCopy: {
      flex: 1,
      gap: 2,
    },
    section: {
      fontWeight: "700",
      marginTop: spacing.xl,
    },
    list: {
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
      padding: spacing.md,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    name: {
      fontWeight: "700",
    },
  });
}
