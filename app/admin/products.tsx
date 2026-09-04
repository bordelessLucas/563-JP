import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { listAllCategories } from "@/src/services/category.service";
import {
  createProduct,
  listAllProducts,
  updateProduct,
} from "@/src/services/product.service";
import { Category, Product, StockStatus } from "@/src/types/catalog";
import { formatCurrency } from "@/src/utils/format";

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
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
      setCategoryId((current) => current || nextCategories[0]?.id || "");
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

  async function handleCreate() {
    const parsedPrice = Number(price.replace(",", "."));
    if (!name.trim() || !categoryId || Number.isNaN(parsedPrice)) {
      Alert.alert("Campos obrigatórios", "Informe nome, categoria e preço.");
      return;
    }
    setSaving(true);
    try {
      await createProduct({
        name: name.trim(),
        description: description.trim() || "Produto criado no admin MVP-3.",
        categoryId,
        price: parsedPrice,
        images: [
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800",
        ],
        active: true,
        featured: false,
        stockStatus: "in_stock" as StockStatus,
      });
      setName("");
      setPrice("");
      setDescription("");
      await load();
      Alert.alert("Produto criado", "Já aparece no catálogo se estiver ativo.");
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao criar produto.",
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
        Criar e atualizar
      </Typography>
      <InlineNotice
        description="CRUD básico no Firestore. Imagem usa placeholder Unsplash."
        title="Catálogo editável"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input
          autoCapitalize="sentences"
          label="Nome"
          onChangeText={setName}
          value={name}
        />
        <Input
          keyboardType="decimal-pad"
          label="Preço"
          onChangeText={setPrice}
          value={price}
        />
        <Input
          autoCapitalize="sentences"
          label="Descrição (opcional)"
          onChangeText={setDescription}
          value={description}
        />
        <Typography variant="caption">Categoria</Typography>
        <View style={styles.chips}>
          {categories.map((category) => {
            const selected = categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategoryId(category.id)}
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
        <Button
          label="Criar produto"
          loading={saving}
          onPress={() => void handleCreate()}
        />
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
                  {formatCurrency(product.price)} ·{" "}
                  {product.active ? "Ativo" : "Inativo"}
                </Typography>
              </View>
              <Switch
                onValueChange={() => void toggleActive(product)}
                trackColor={{ true: colors.primary, false: colors.border }}
                value={product.active}
              />
            </View>
          </View>
        ))}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipOn: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontWeight: "700",
  },
  chipLabelOn: {
    color: colors.primary,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
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
