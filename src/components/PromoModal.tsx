import { Image, Modal, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { Banner } from "@/src/types/catalog";

type PromoModalProps = {
  promo: Banner;
  visible: boolean;
  onClose: () => void;
  onAction: () => void;
};

export function PromoModal({
  promo,
  visible,
  onClose,
  onAction,
}: PromoModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {promo.image ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: promo.image }}
              style={styles.image}
            />
          ) : null}
          <View style={styles.body}>
            <Typography style={styles.eyebrow} variant="caption">
              PROMOÇÃO
            </Typography>
            <Typography style={styles.title} variant="title">
              {promo.title}
            </Typography>
            {promo.body ? (
              <Typography variant="caption">{promo.body}</Typography>
            ) : null}
            <View style={styles.actions}>
              <Button
                label={promo.ctaLabel || "Ver oferta"}
                onPress={onAction}
              />
              <Button label="Agora não" onPress={onClose} variant="outline" />
            </View>
          </View>
          <Pressable
            accessibilityLabel="Fechar promoção"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.close}
          >
            <Typography style={styles.closeLabel} variant="caption">
              Fechar
            </Typography>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 20, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    maxWidth: 420,
    overflow: "hidden",
    width: "100%",
  },
  image: {
    backgroundColor: colors.secondary,
    height: 180,
    width: "100%",
  },
  body: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    marginBottom: 0,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  close: {
    minHeight: 44,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  closeLabel: {
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
  },
});
