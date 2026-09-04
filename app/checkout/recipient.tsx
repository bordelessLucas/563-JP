import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
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

export default function CheckoutRecipientScreen() {
  const router = useRouter();
  const { cart, saveCheckout } = useCart();
  const [recipient, setRecipient] = useState<RecipientDraft>(createEmptyRecipient());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cart?.checkout?.recipient) {
      setRecipient(cart.checkout.recipient);
    }
  }, [cart?.checkout?.recipient]);

  const canContinue = useMemo(
    () => recipient.name.trim().length > 1 && recipient.phone.trim().length >= 8,
    [recipient.name, recipient.phone],
  );

  const handleContinue = async () => {
    if (!canContinue || !cart) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container keyboardAware scroll>
      <Typography variant="caption">ETAPA 1 DE 5</Typography>
      <Typography style={styles.title} variant="title">
        Para quem vamos entregar?
      </Typography>
      <InlineNotice
        description="O comprador e o destinatário podem ser pessoas diferentes."
        title="Destinatário"
        tone="info"
      />

      <View style={styles.form}>
        <Input
          autoCapitalize="words"
          label="Nome do destinatário"
          onChangeText={(name) => setRecipient((current) => ({ ...current, name }))}
          placeholder="Nome completo"
          value={recipient.name}
        />
        <Input
          keyboardType="phone-pad"
          label="Telefone"
          onChangeText={(phone) => setRecipient((current) => ({ ...current, phone }))}
          placeholder="(11) 99999-9999"
          value={recipient.phone}
        />
        <Input
          autoCapitalize="sentences"
          label="Observações (opcional)"
          onChangeText={(notes) => setRecipient((current) => ({ ...current, notes }))}
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
