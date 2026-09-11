import { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";
import { useTheme } from "@/src/contexts/ThemeContext";
import type { ThemeColors } from "@/src/theme/types";

type ImageGalleryProps = {
  images: string[];
  height?: number;
};

const width = Dimensions.get("window").width;

export function ImageGallery({ images, height = 340 }: ImageGalleryProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function createStyles(palette: ThemeColors) {
  return StyleSheet.create({
    image: {
      backgroundColor: palette.secondary,
    },
    fallback: {
      backgroundColor: palette.softAccent,
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
      color: palette.white,
      fontWeight: "700",
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xs,
      justifyContent: "center",
    },
    dot: {
      backgroundColor: palette.white,
      borderRadius: radius.sm,
      height: 8,
      opacity: 0.45,
      width: 8,
    },
    dotActive: {
      backgroundColor: palette.accent,
      opacity: 1,
      width: 18,
    },
  });
}
