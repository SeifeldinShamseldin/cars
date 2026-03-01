import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appColors } from "../theme/paperTheme";

type ScreenShellProps = PropsWithChildren<{
  footer?: ReactNode;
  scrollEnabled?: boolean;
}>;

export const ScreenShell = ({
  children,
  footer,
  scrollEnabled = true,
}: ScreenShellProps) => (
  <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
    <View style={styles.background}>
      <View style={styles.blobTop} />
      <View style={styles.blobMiddle} />
      <View style={styles.blobBottom} />
      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            footer ? styles.contentWithFooter : null,
          ]}
          scrollEnabled
          bounces
          alwaysBounceVertical
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.staticContent]}>
          {children}
        </View>
      )}
      {footer ? <View style={styles.footerLayer}>{footer}</View> : null}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  staticContent: {
    flex: 1,
  },
  contentWithFooter: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  footerLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  blobTop: {
    position: "absolute",
    top: -120,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(231, 211, 26, 0.08)",
  },
  blobMiddle: {
    position: "absolute",
    top: 180,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  blobBottom: {
    position: "absolute",
    bottom: -90,
    right: -40,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(231, 211, 26, 0.05)",
  },
});
