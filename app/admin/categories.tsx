import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { LoadingState } from "@/src/components/LoadingState";
import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  createCategory,
  listAllCategories,
  updateCategory,
} from "@/src/services/category.service";
import type { ThemeColors } from "@/src/theme/types";
import { Category } from "@/src/types/catalog";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type FormState = {
  name: string;
  order: string;
  imageUrl: string;
  active: boolean;
};

const emptyForm = (order = 1): FormState => ({
  name: "",
  order: String(order),
  imageUrl: DEFAULT_IMAGE,
  active: true,
});

export default function AdminCategoriesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
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

  function patchForm(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm(categories.length + 1));
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      order: String(category.order),
      imageUrl: category.image || DEFAULT_IMAGE,
      active: category.active,
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da categoria.");
      return;
    }
    const order = Number(form.order);
    if (Number.isNaN(order) || order < 0) {
      Alert.alert("Ordem inválida", "Informe um número de ordem (≥ 0).");
      return;
    }

    setSaving(true);
    try {
      const slug = slugify(form.name) || `cat-${Date.now()}`;
      const payload = {
        name: form.name.trim(),
        slug,
        image: form.imageUrl.trim() || DEFAULT_IMAGE,
        active: form.active,
        order: Math.floor(order),
      };
      if (editingId) {
        await updateCategory(editingId, payload);
        Alert.alert("Categoria atualizada", "Alterações salvas.");
      } else {
        await createCategory(payload);
        Alert.alert("Categoria criada", "Disponível no catálogo se ativa.");
      }
      startCreate();
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao salvar categoria.",
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
        {editingId ? "Editar categoria" : "Nova categoria"}
      </Typography>
      <InlineNotice
        description="Defina nome, ordem de exibição e imagem. Categorias inativas somem da home e do filtro."
        title="Categorias da loja"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input
          label="Nome da categoria"
          onChangeText={(name) => patchForm({ name })}
          value={form.name}
        />
        <Input
          keyboardType="number-pad"
          label="Ordem de exibição"
          onChangeText={(order) => patchForm({ order })}
          value={form.order}
        />
        <Input
          autoCapitalize="none"
          label="URL da imagem"
          onChangeText={(imageUrl) => patchForm({ imageUrl })}
          value={form.imageUrl}
        />
        <View style={styles.switchRow}>
          <Typography variant="body">Ativa no catálogo</Typography>
          <Switch
            onValueChange={(active) => patchForm({ active })}
            trackColor={{ true: colors.primary, false: colors.border }}
            value={form.active}
          />
        </View>
        <Button
          label={editingId ? "Salvar alterações" : "Criar categoria"}
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
                  Ordem de exibição: {category.order} ·{" "}
                  {category.active ? "Ativa" : "Inativa"}
                </Typography>
              </View>
              <Switch
                onValueChange={() => void toggleActive(category)}
                trackColor={{ true: colors.primary, false: colors.border }}
                value={category.active}
              />
            </View>
            <Button
              label="Editar"
              onPress={() => startEdit(category)}
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
    switchRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 44,
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
