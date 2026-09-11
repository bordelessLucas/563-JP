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
import {
  createBanner,
  listAllBanners,
  updateBanner,
} from "@/src/services/banner.service";
import { listAllCategories } from "@/src/services/category.service";
import { listAllProducts } from "@/src/services/product.service";
import type { ThemeColors } from "@/src/theme/types";
import {
  Banner,
  BannerDestination,
  Category,
  Product,
} from "@/src/types/catalog";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=1600&q=80";

type FormState = {
  title: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  order: string;
  asModal: boolean;
  active: boolean;
  destinationType: BannerDestination["type"];
  destinationId: string;
};

const emptyForm = (order = 1): FormState => ({
  title: "",
  body: "",
  imageUrl: DEFAULT_IMAGE,
  ctaLabel: "Ver oferta",
  order: String(order),
  asModal: false,
  active: true,
  destinationType: "category",
  destinationId: "",
});

export default function AdminPromotionsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextBanners, nextCategories, nextProducts] = await Promise.all([
        listAllBanners(),
        listAllCategories(),
        listAllProducts(),
      ]);
      setBanners(nextBanners);
      setCategories(nextCategories);
      setProducts(nextProducts);
      setForm((current) => ({
        ...current,
        destinationId:
          current.destinationId ||
          nextCategories[0]?.id ||
          nextProducts[0]?.id ||
          "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar promoções.",
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
    setForm({
      ...emptyForm(banners.length + 1),
      destinationId: categories[0]?.id || products[0]?.id || "",
    });
  }

  function startEdit(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      body: banner.body,
      imageUrl: banner.image || DEFAULT_IMAGE,
      ctaLabel: banner.ctaLabel || "Ver oferta",
      order: String(banner.order),
      asModal: banner.asModal,
      active: banner.active,
      destinationType: banner.destination.type,
      destinationId: banner.destination.id,
    });
  }

  async function handleSave() {
    if (!form.title.trim()) {
      Alert.alert("Título obrigatório", "Informe o título da promoção.");
      return;
    }
    const order = Number(form.order);
    if (Number.isNaN(order) || order < 0) {
      Alert.alert("Ordem inválida", "Informe um número de ordem (≥ 0).");
      return;
    }
    if (
      (form.destinationType === "category" ||
        form.destinationType === "product") &&
      !form.destinationId
    ) {
      Alert.alert(
        "Destino obrigatório",
        "Escolha a categoria ou o produto da promoção.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        image: form.imageUrl.trim() || DEFAULT_IMAGE,
        ctaLabel: form.ctaLabel.trim() || "Ver oferta",
        asModal: form.asModal,
        active: form.active,
        order: Math.floor(order),
        destination: {
          type: form.destinationType,
          id: form.destinationId,
        } as BannerDestination,
      };
      if (editingId) {
        await updateBanner(editingId, payload);
        Alert.alert("Promoção atualizada", "Alterações salvas.");
      } else {
        await createBanner(payload);
        Alert.alert(
          "Promoção criada",
          form.asModal
            ? "Se ativa, entra na home e pode abrir no modal só na 1ª vez (maior prioridade = menor ordem)."
            : "Se ativa, aparece só na faixa de promoções da home (sem modal).",
        );
      }
      startCreate();
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao salvar promoção.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(banner: Banner) {
    try {
      await updateBanner(banner.id, { active: !banner.active });
      await load();
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao atualizar.",
      );
    }
  }

  const destinationOptions =
    form.destinationType === "product" ? products : categories;

  if (loading) {
    return (
      <Container>
        <LoadingState label="Carregando promoções…" />
      </Container>
    );
  }

  return (
    <Container scroll>
      <Typography variant="caption">ADMIN · PROMOÇÕES</Typography>
      <Typography style={styles.title} variant="title">
        {editingId ? "Editar promoção" : "Nova promoção"}
      </Typography>
      <InlineNotice
        description="Toda promoção ativa aparece na faixa da home. Se marcar “Modal na 1ª abertura”, só a de maior prioridade (menor ordem) abre uma única vez ao entrar no app."
        title="Campanhas e destaques"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input
          label="Título"
          onChangeText={(title) => patchForm({ title })}
          value={form.title}
        />
        <Input
          label="Texto da promoção"
          onChangeText={(body) => patchForm({ body })}
          value={form.body}
        />
        <Input
          autoCapitalize="none"
          label="URL da imagem"
          onChangeText={(imageUrl) => patchForm({ imageUrl })}
          value={form.imageUrl}
        />
        <Input
          label="Texto do botão"
          onChangeText={(ctaLabel) => patchForm({ ctaLabel })}
          value={form.ctaLabel}
        />
        <Input
          keyboardType="number-pad"
          label="Ordem"
          onChangeText={(order) => patchForm({ order })}
          value={form.order}
        />

        <Typography variant="caption">Destino do botão</Typography>
        <View style={styles.chips}>
          {(
            [
              ["category", "Categoria"],
              ["product", "Produto"],
              ["collection", "Catálogo"],
            ] as const
          ).map(([type, label]) => {
            const selected = form.destinationType === type;
            return (
              <Pressable
                key={type}
                onPress={() =>
                  patchForm({
                    destinationType: type,
                    destinationId:
                      type === "product"
                        ? products[0]?.id || ""
                        : type === "category"
                          ? categories[0]?.id || ""
                          : "",
                  })
                }
                style={[styles.chip, selected && styles.chipOn]}
              >
                <Typography
                  style={[styles.chipLabel, selected && styles.chipLabelOn]}
                  variant="caption"
                >
                  {label}
                </Typography>
              </Pressable>
            );
          })}
        </View>

        {form.destinationType === "category" ||
        form.destinationType === "product" ? (
          <View style={styles.chips}>
            {destinationOptions.map((item) => {
              const selected = form.destinationId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => patchForm({ destinationId: item.id })}
                  style={[styles.chip, selected && styles.chipOn]}
                >
                  <Typography
                    style={[styles.chipLabel, selected && styles.chipLabelOn]}
                    variant="caption"
                  >
                    {item.name}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Typography variant="body">Modal na 1ª abertura</Typography>
            <Typography variant="caption">
              Desligado = só na home. Ligado = candidata ao único modal (prioridade pela ordem)
            </Typography>
          </View>
          <Switch
            onValueChange={(asModal) => patchForm({ asModal })}
            trackColor={{ true: colors.primary, false: colors.border }}
            value={form.asModal}
          />
        </View>
        <View style={styles.switchRow}>
          <Typography variant="body">Ativa</Typography>
          <Switch
            onValueChange={(active) => patchForm({ active })}
            trackColor={{ true: colors.primary, false: colors.border }}
            value={form.active}
          />
        </View>

        <Button
          label={editingId ? "Salvar alterações" : "Criar promoção"}
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
        Lista ({banners.length})
      </Typography>
      <View style={styles.list}>
        {banners.map((banner) => (
          <View key={banner.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Typography style={styles.name} variant="body">
                  {banner.title}
                </Typography>
                <Typography variant="caption">
                  Ordem {banner.order} ·{" "}
                  {banner.asModal
                    ? "Modal na 1ª abertura"
                    : "Somente na home"}{" "}
                  · {banner.active ? "Ativa" : "Inativa"}
                </Typography>
              </View>
              <Switch
                onValueChange={() => void toggleActive(banner)}
                trackColor={{ true: colors.primary, false: colors.border }}
                value={banner.active}
              />
            </View>
            <Button
              label="Editar"
              onPress={() => startEdit(banner)}
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
