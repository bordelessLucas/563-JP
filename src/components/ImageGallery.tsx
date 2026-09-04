import { useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

type ImageGalleryProps = {
  images: string[];
  height?: number;
};

const width = Dimensions.get("window").width;

export function ImageGallery({ images, height = 340 }: ImageGalleryProps) {
  const [index, setIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(nextIndex);
  };

  if (images.length === 0) {
    return <View style={[styles.fallback, { height }]} />;
  }

  return (
    <View accessibilityLabel={`Galeria de imagens, foto ${index + 1} de ${images.length}`}>
      <ScrollView
        horizontal
        onMomentumScrollEnd={onScroll}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {images.map((image, imageIndex) => (
          <Image
            key={`${image}-${imageIndex}`}
            accessibilityIgnoresInvertColors
            source={{ uri: image }}
            style={[styles.image, { height, width }]}
          />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.footer}>
          <View style={styles.counter}>
            <Typography style={styles.counterLabel} variant="caption">
              {index + 1}/{images.length}
            </Typography>
          </View>
          <View style={styles.dots}>
            {images.map((image, dotIndex) => (
              <View
                key={`${image}-dot-${dotIndex}`}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.secondary,
  },
  fallback: {
    backgroundColor: colors.softAccent,
    width: "100%",
  },
  footer: {
    bottom: spacing.md,
    left: 0,
    position: "absolute",
    right: 0,
  },
  counter: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(28, 43, 38, 0.7)",
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    marginRight: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  counterLabel: {
    color: colors.white,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  dot: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    height: 8,
    opacity: 0.45,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.accent,
    opacity: 1,
    width: 18,
  },
});
