import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { appColors } from "../theme/paperTheme";
import { appSpacing } from "../theme/tokens";

type ScreenShellProps = PropsWithChildren<{
  scrollEnabled?: boolean;
  padded?: boolean;
  safeAreaEdges?: Edge[];
}>;

export const ScreenShell = ({
  children,
  scrollEnabled = true,
  padded = true,
  safeAreaEdges = ["top", "left", "right"],
}: ScreenShellProps) => (
  <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
    <View style={styles.background}>
      <View style={styles.blobTop} />
      <View style={styles.blobMiddle} />
      <View style={styles.blobBottom} />
      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={[styles.content, !padded ? styles.contentUnpadded : null]}
          scrollEnabled
          bounces
          alwaysBounceVertical
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            styles.staticContent,
            !padded ? styles.contentUnpadded : null,
          ]}
        >
          {children}
        </View>
      )}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  background: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: appSpacing.xxl,
    paddingVertical: appSpacing.xxl,
    gap: appSpacing.xxl,
  },
  contentUnpadded: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
  },
  staticContent: {
    flex: 1,
  },
  blobTop: {
    position: "absolute",
    top: -120,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "transparent",
  },
  blobMiddle: {
    position: "absolute",
    top: 180,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "transparent",
  },
  blobBottom: {
    position: "absolute",
    bottom: -90,
    right: -40,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "transparent",
  },
});
