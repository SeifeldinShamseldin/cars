import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  Image,
  type ImageContentFit,
  type ImageProps,
  type ImageSource,
} from "expo-image";

type ResponsiveImageProps = {
  source: ImageSource | string;
  height: number;
  borderRadius?: number;
  contentFit?: ImageContentFit;
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  priority?: NonNullable<ImageProps["priority"]>;
  cachePolicy?: NonNullable<ImageProps["cachePolicy"]>;
  transitionMs?: number | null;
};

const getRemoteImageUri = (source: ImageSource | string): string | undefined => {
  if (typeof source === "string") {
    return source.startsWith("http://") || source.startsWith("https://")
      ? source
      : undefined;
  }

  if (source && typeof source === "object" && "uri" in source) {
    return typeof source.uri === "string" &&
      (source.uri.startsWith("http://") || source.uri.startsWith("https://"))
      ? source.uri
      : undefined;
  }

  return undefined;
};

export const ResponsiveImage = ({
  source,
  height,
  borderRadius = 0,
  contentFit = "contain",
  containerStyle,
  backgroundColor = "transparent",
  priority = "normal",
  cachePolicy = "memory-disk",
  transitionMs = 0,
}: ResponsiveImageProps) => (
  <View
    style={[
      styles.container,
      {
        height,
        borderRadius,
        backgroundColor,
      },
      containerStyle,
    ]}
  >
    <Image
      source={source}
      style={styles.image}
      contentFit={contentFit}
      contentPosition="center"
      cachePolicy={cachePolicy}
      priority={priority}
      recyclingKey={getRemoteImageUri(source)}
      transition={transitionMs}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
});
