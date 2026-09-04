import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import {
  createCategory,
  listAllCategories,
  updateCategory,
} from "@/src/services/category.service";
import { Category } from "@/src/types/catalog";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCategories(await listAllCategories());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar categorias.",
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
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da categoria.");
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(name);
      await createCategory({
        name: name.trim(),
        slug: slug || `cat-${Date.now()}`,
        image:
          "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800",
        active: true,
        order: categories.length + 1,
      });
      setName("");
      await load();
      Alert.alert("Categoria criada", "Disponível no catálogo se ativa.");
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao criar categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    try {
      await updateCategory(category.id, { active: !category.active });
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
        <LoadingState label="Carregando categorias…" />
      </Container>
    );
  }

  return (
    <Container scroll>
      <Typography variant="caption">ADMIN · CATEGORIAS</Typography>
      <Typography style={styles.title} variant="title">
        Organizar catálogo
      </Typography>
      <InlineNotice
        description="Criação e ativação/desativação no Firestore para o painel."
        title="CRUD básico"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input label="Nome da categoria" onChangeText={setName} value={name} />
        <Button
          label="Criar categoria"
          loading={saving}
          onPress={() => void handleCreate()}
        />
      </View>

      <Typography style={styles.section} variant="subtitle">
        Lista ({categories.length})
      </Typography>
      <View style={styles.list}>
        {categories.map((category) => (
          <View key={category.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Typography style={styles.name} variant="body">
                  {category.name}
                </Typography>
                <Typography variant="caption">
                  {category.slug} · ordem {category.order} ·{" "}
                  {category.active ? "Ativa" : "Inativa"}
                </Typography>
              </View>
              <Switch
                onValueChange={() => void toggleActive(category)}
                trackColor={{ true: colors.primary, false: colors.border }}
                value={category.active}
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
