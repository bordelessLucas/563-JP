import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Container } from "@/src/components/Container";
import { InlineNotice } from "@/src/components/InlineNotice";
import { Input } from "@/src/components/Input";
import { LoadingState } from "@/src/components/LoadingState";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCart } from "@/src/contexts/CartContext";
import { createAddress, listAddresses } from "@/src/services/address.service";
import { formatCep, lookupCep, onlyDigits } from "@/src/services/cep.service";
import {
  createEmptyAddress,
  DeliveryAddressDraft,
  SavedAddress,
} from "@/src/types/checkout";

export default function CheckoutAddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, saveCheckout } = useCart();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [address, setAddress] = useState<DeliveryAddressDraft>(createEmptyAddress());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepSuccess, setCepSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const lastLookedUpCep = useRef<string>("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const addresses = await listAddresses(user.uid);
        if (!active) return;
        setSavedAddresses(addresses);
        const draft = cart?.checkout?.address;
        if (draft?.id) {
          setSelectedId(draft.id);
          setAddress(draft);
          setShowForm(false);
        } else if (draft) {
          setAddress(draft);
          setShowForm(true);
        } else if (addresses.length === 0) {
          setShowForm(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [cart?.checkout?.address, user]);

  useEffect(() => {
    const digits = onlyDigits(address.cep);
    if (digits.length !== 8 || selectedId || !showForm) return;
    if (lastLookedUpCep.current === digits) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          setLookingUpCep(true);
          setCepError(null);
          setCepSuccess(null);
          const result = await lookupCep(digits);
          if (cancelled) return;
          lastLookedUpCep.current = digits;
          if (!result) {
            setCepError("CEP não encontrado. Preencha o endereço manualmente.");
            return;
          }
          setAddress((current) => ({
            ...current,
            cep: result.cep,
            street: result.street || current.street,
            neighborhood: result.neighborhood || current.neighborhood,
            city: result.city || current.city,
            state: result.state || current.state,
          }));
          setCepSuccess("Endereço preenchido pelo CEP. Confira e complete o número.");
        } catch {
          if (!cancelled) {
            setCepError("Não foi possível consultar o CEP agora.");
          }
        } finally {
          if (!cancelled) setLookingUpCep(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address.cep, selectedId, showForm]);

  const canContinue = useMemo(() => {
    if (selectedId) return true;
    return (
      onlyDigits(address.cep).length === 8 &&
      address.street.trim().length > 2 &&
      address.number.trim().length > 0 &&
      address.neighborhood.trim().length > 1 &&
      address.city.trim().length > 1 &&
      address.state.trim().length === 2
    );
  }, [address, selectedId]);

  const selectSaved = (item: SavedAddress) => {
    setSelectedId(item.id);
    setAddress(item);
    setShowForm(false);
    setCepError(null);
    setCepSuccess(null);
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    const digits = onlyDigits(formatted);
    if (digits !== lastLookedUpCep.current) {
      lastLookedUpCep.current = "";
    }
    setSelectedId(null);
    setCepError(null);
    setCepSuccess(null);
    setAddress((current) => ({ ...current, cep: formatted }));
  };

  const handleContinue = async () => {
    if (!canContinue || !cart || !user) return;
    setSaving(true);
    try {
      let nextAddress = address;
      if (!selectedId) {
        const created = await createAddress(user.uid, {
          ...address,
          cep: formatCep(address.cep),
        });
        nextAddress = created;
        setSavedAddresses((current) => [...current, created]);
        setSelectedId(created.id);
      }

      await saveCheckout({
        recipient: cart.checkout?.recipient ?? {
          name: "",
          phone: "",
          notes: "",
        },
        address: {
          id: selectedId ?? nextAddress.id,
          cep: formatCep(nextAddress.cep),
          street: nextAddress.street.trim(),
          number: nextAddress.number.trim(),
          complement: nextAddress.complement.trim(),
          neighborhood: nextAddress.neighborhood.trim(),
          city: nextAddress.city.trim(),
          state: nextAddress.state.trim().toUpperCase(),
          reference: nextAddress.reference.trim(),
        },
        deliveryDate: cart.checkout?.deliveryDate ?? "",
        deliveryPeriodId: cart.checkout?.deliveryPeriodId ?? "",
        deliveryPeriodLabel: cart.checkout?.deliveryPeriodLabel ?? "",
      });
      router.push("/checkout/schedule" as Href);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState label="Carregando endereços..." />
      </Container>
    );
  }

  return (
    <Container keyboardAware scroll>
      <Typography variant="caption">ETAPA 2 DE 5</Typography>
      <Typography style={styles.title} variant="title">
        Onde entregar?
      </Typography>
      <InlineNotice
        description="Digite o CEP para preencher rua, bairro, cidade e UF automaticamente."
        title="Endereço de entrega"
        tone="info"
      />

      {savedAddresses.length > 0 ? (
        <View style={styles.savedList}>
          {savedAddresses.map((item) => {
            const selected = selectedId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => selectSaved(item)}
                style={[styles.savedCard, selected && styles.savedCardActive]}
              >
                <Typography style={styles.savedTitle} variant="body">
                  {item.street}, {item.number}
                </Typography>
                <Typography variant="caption">
                  {item.neighborhood} · {item.city}/{item.state} · CEP {item.cep}
                </Typography>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              setSelectedId(null);
              setAddress(createEmptyAddress());
              setShowForm(true);
              setCepError(null);
              setCepSuccess(null);
              lastLookedUpCep.current = "";
            }}
          >
            <Typography style={styles.link} variant="caption">
              + Cadastrar novo endereço
            </Typography>
          </Pressable>
        </View>
      ) : null}

      {showForm || savedAddresses.length === 0 ? (
        <View style={styles.form}>
          <Input
            error={cepError ?? undefined}
            keyboardType="number-pad"
            label="CEP"
            maxLength={9}
            onChangeText={handleCepChange}
            placeholder="00000-000"
            value={address.cep}
          />
          {lookingUpCep ? (
            <Typography variant="caption">Buscando endereço pelo CEP...</Typography>
          ) : null}
          {cepSuccess ? (
            <Typography style={styles.success} variant="caption">
              {cepSuccess}
            </Typography>
          ) : null}
          <Input
            label="Rua"
            onChangeText={(street) =>
              setAddress((current) => ({ ...current, street }))
            }
            placeholder="Nome da rua"
            value={address.street}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="Número"
                onChangeText={(number) =>
                  setAddress((current) => ({ ...current, number }))
                }
                placeholder="123"
                value={address.number}
              />
            </View>
            <View style={styles.half}>
              <Input
                autoCapitalize="characters"
                label="UF"
                maxLength={2}
                onChangeText={(state) =>
                  setAddress((current) => ({ ...current, state }))
                }
                placeholder="SP"
                value={address.state}
              />
            </View>
          </View>
          <Input
            label="Complemento (opcional)"
            onChangeText={(complement) =>
              setAddress((current) => ({ ...current, complement }))
            }
            placeholder="Apto, bloco..."
            value={address.complement}
          />
          <Input
            label="Bairro"
            onChangeText={(neighborhood) =>
              setAddress((current) => ({ ...current, neighborhood }))
            }
            placeholder="Bairro"
            value={address.neighborhood}
          />
          <Input
            label="Cidade"
            onChangeText={(city) => setAddress((current) => ({ ...current, city }))}
            placeholder="Cidade"
            value={address.city}
          />
          <Input
            label="Referência (opcional)"
            onChangeText={(reference) =>
              setAddress((current) => ({ ...current, reference }))
            }
            placeholder="Ponto de referência"
            value={address.reference}
          />
        </View>
      ) : null}

      <Button
        disabled={!canContinue || lookingUpCep}
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
  savedList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  savedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  savedCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  savedTitle: {
    fontWeight: "700",
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  success: {
    color: colors.success,
    fontWeight: "700",
  },
});
