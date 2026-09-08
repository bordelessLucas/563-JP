import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { CheckoutStepper } from "@/src/components/CheckoutStepper";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useCart } from "@/src/contexts/CartContext";
import {
  createEmptyRecipient,
  RecipientDraft,
} from "@/src/types/checkout";
import {
  formatPhoneMask,
  isValidRecipientPhone,
} from "@/src/utils/checkout";

export default function CheckoutRecipientScreen() {
  const router = useRouter();
  const { cart, saveCheckout } = useCart();
  const [recipient, setRecipient] = useState<RecipientDraft>(
    createEmptyRecipient(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedPhone, setTouchedPhone] = useState(false);

  useEffect(() => {
    if (cart?.checkout?.recipient) {
      setRecipient(cart.checkout.recipient);
    }
  }, [cart?.checkout?.recipient]);

  const phoneError =
    touchedPhone && recipient.phone.trim().length > 0 && !isValidRecipientPhone(recipient.phone)
      ? "Informe um telefone com DDD (10 ou 11 dígitos)."
      : undefined;

  const canContinue = useMemo(
    () =>
      recipient.name.trim().length > 1 &&
      isValidRecipientPhone(recipient.phone),
    [recipient.name, recipient.phone],
  );

  const handleContinue = async () => {
    setTouchedPhone(true);
    if (!canContinue || !cart) return;
    setSaving(true);
    setError(null);
    try {
      await saveCheckout({
        recipient: {
          name: recipient.name.trim(),
          phone: recipient.phone.trim(),
          notes: recipient.notes.trim(),
        },
        address: cart.checkout?.address ?? null,
        deliveryDate: cart.checkout?.deliveryDate ?? "",
        deliveryPeriodId: cart.checkout?.deliveryPeriodId ?? "",
        deliveryPeriodLabel: cart.checkout?.deliveryPeriodLabel ?? "",
      });
      router.push("/checkout/address" as Href);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o destinatário. Tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container keyboardAware scroll>
      <CheckoutStepper step={1} />
      <Typography style={styles.title} variant="title">
        Para quem vamos entregar?
      </Typography>
      <InlineNotice
        description="O comprador e o destinatário podem ser pessoas diferentes."
        title="Destinatário"
        tone="info"
      />

      {error ? (
        <InlineNotice description={error} title="Erro ao salvar" tone="error" />
      ) : null}

      <View style={styles.form}>
        <Input
          autoCapitalize="words"
          label="Nome do destinatário"
          onChangeText={(name) =>
            setRecipient((current) => ({ ...current, name }))
          }
          placeholder="Nome completo"
          value={recipient.name}
        />
        <Input
          error={phoneError}
          keyboardType="phone-pad"
          label="Telefone"
          onBlur={() => setTouchedPhone(true)}
          onChangeText={(phone) =>
            setRecipient((current) => ({
              ...current,
              phone: formatPhoneMask(phone),
            }))
          }
          placeholder="(11) 99999-9999"
          value={recipient.phone}
        />
        <Input
          autoCapitalize="sentences"
          label="Observações (opcional)"
          onChangeText={(notes) =>
            setRecipient((current) => ({ ...current, notes }))
          }
          placeholder="Ex.: entregar na portaria"
          value={recipient.notes}
        />
      </View>

      <Button
        disabled={!canContinue}
        label="Continuar"
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
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
});
