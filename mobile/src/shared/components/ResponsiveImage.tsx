import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image, type ImageContentFit, type ImageSource } from "expo-image";

type ResponsiveImageProps = {
  source: ImageSource | string;
  height: number;
  borderRadius?: number;
  contentFit?: ImageContentFit;
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

export const ResponsiveImage = ({
  source,
  height,
  borderRadius = 0,
  contentFit = "contain",
  containerStyle,
  backgroundColor = "transparent",
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
      transition={120}
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
