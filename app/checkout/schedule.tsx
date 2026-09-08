import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { CheckoutStepper } from "@/src/components/CheckoutStepper";
import { Container } from "@/src/components/Container";
import { DeliveryCalendar } from "@/src/components/DeliveryCalendar";
import { EmptyState } from "@/src/components/EmptyState";
import { InlineNotice } from "@/src/components/InlineNotice";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import { getOperationSettings } from "@/src/services/settings.service";
import { DeliveryPeriod } from "@/src/types/checkout";

const MAX_DAYS_AHEAD = 60;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default function CheckoutScheduleScreen() {
  const router = useRouter();
  const { cart, saveCheckout } = useCart();
  const [periods, setPeriods] = useState<DeliveryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const minDate = useMemo(() => {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const maxDate = useMemo(() => {
    const date = startOfDay(minDate);
    date.setDate(date.getDate() + MAX_DAYS_AHEAD - 1);
    return date;
  }, [minDate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const settings = await getOperationSettings();
        if (!active) return;
        setPeriods(settings.periods);

        const draftDate = cart?.checkout?.deliveryDate;
        const draftAsDate = draftDate
          ? startOfDay(
              new Date(
                Number(draftDate.slice(0, 4)),
                Number(draftDate.slice(5, 7)) - 1,
                Number(draftDate.slice(8, 10)),
              ),
            )
          : null;
        const isDraftValid =
          draftAsDate !== null &&
          draftAsDate >= minDate &&
          draftAsDate <= maxDate;

        setDeliveryDate(
          isDraftValid && draftDate ? draftDate : formatDateInput(minDate),
        );
        setPeriodId(
          cart?.checkout?.deliveryPeriodId || settings.periods[0]?.id || "",
        );
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as datas.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [
    cart?.checkout?.deliveryDate,
    cart?.checkout?.deliveryPeriodId,
    maxDate,
    minDate,
    reloadKey,
  ]);

  const selectedPeriod = periods.find((period) => period.id === periodId);
  const canContinue = Boolean(deliveryDate && selectedPeriod);

  const handleContinue = async () => {
    if (!canContinue || !cart || !selectedPeriod) return;
    setSaving(true);
    setError(null);
    try {
      await saveCheckout({
        recipient: cart.checkout?.recipient ?? {
          name: "",
          phone: "",
          notes: "",
        },
        address: cart.checkout?.address ?? null,
        deliveryDate,
        deliveryPeriodId: selectedPeriod.id,
        deliveryPeriodLabel: selectedPeriod.label,
      });
      router.push("/checkout/summary" as Href);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a agenda. Tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState label="Carregando períodos..." />
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container>
        <EmptyState
          actionLabel="Tentar novamente"
          description={loadError}
          icon="alert-circle-outline"
          onAction={() => setReloadKey((current) => current + 1)}
          title="Não foi possível carregar as datas"
        />
      </Container>
    );
  }

  return (
    <Container scroll>
      <CheckoutStepper step={3} />
      <Typography style={styles.title} variant="title">
        Quando entregar?
      </Typography>
      {error ? (
        <InlineNotice description={error} title="Erro ao salvar" tone="error" />
      ) : null}
      <InlineNotice
        description="Escolha a partir de amanhã, nos próximos 60 dias. Datas passadas não ficam disponíveis."
        title="Data de entrega"
        tone="info"
      />

      <Typography style={styles.section} variant="caption">
        Data
      </Typography>
      <DeliveryCalendar
        maxDate={maxDate}
        minDate={minDate}
        onSelectDate={setDeliveryDate}
        selectedDate={deliveryDate}
      />
      {deliveryDate ? (
        <Typography style={styles.selectedDate} variant="caption">
          Selecionada: {formatDateLabel(deliveryDate)}
        </Typography>
      ) : null}

      <Typography style={styles.section} variant="caption">
        Período
      </Typography>
      <View style={styles.periodList}>
        {periods.map((period) => {
          const selected = periodId === period.id;
          return (
            <Pressable
              key={period.id}
              onPress={() => setPeriodId(period.id)}
              style={[styles.periodCard, selected && styles.periodCardActive]}
            >
              <Typography style={styles.periodLabel} variant="body">
                {period.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <Button
        disabled={!canContinue}
        label="Revisar pedido"
        loading={saving}
        onPress={() => {
          void handleContinue();
        }}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
  },
  section: {
    fontWeight: "700",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  selectedDate: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  periodList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  periodCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  periodCardActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  periodLabel: {
    fontWeight: "700",
  },
});
