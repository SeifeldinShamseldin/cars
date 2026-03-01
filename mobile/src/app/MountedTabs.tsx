import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type MountedTabsProps = {
  activeTab: "SELL" | "UPDATES" | "GAMES" | "PROFILE";
  sellTab: ReactNode;
  updatesTab: ReactNode;
  gamesTab: ReactNode;
  profileTab: ReactNode;
};

export const MountedTabs = ({
  activeTab,
  sellTab,
  updatesTab,
  gamesTab,
  profileTab,
}: MountedTabsProps) => (
  <View style={styles.tabStack}>
    <View
      pointerEvents={activeTab === "SELL" ? "auto" : "none"}
      style={[
        styles.tabLayer,
        activeTab === "SELL" ? styles.tabLayerVisible : styles.tabLayerHidden,
      ]}
    >
      {sellTab}
    </View>
    <View
      pointerEvents={activeTab === "UPDATES" ? "auto" : "none"}
      style={[
        styles.tabLayer,
        activeTab === "UPDATES" ? styles.tabLayerVisible : styles.tabLayerHidden,
      ]}
    >
      {updatesTab}
    </View>
    <View
      pointerEvents={activeTab === "GAMES" ? "auto" : "none"}
      style={[
        styles.tabLayer,
        activeTab === "GAMES" ? styles.tabLayerVisible : styles.tabLayerHidden,
      ]}
    >
      {gamesTab}
    </View>
    <View
      pointerEvents={activeTab === "PROFILE" ? "auto" : "none"}
      style={[
        styles.tabLayer,
        activeTab === "PROFILE" ? styles.tabLayerVisible : styles.tabLayerHidden,
      ]}
    >
      {profileTab}
    </View>
  </View>
);

const styles = StyleSheet.create({
  tabStack: {
    flex: 1,
  },
  tabLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabLayerVisible: {
    opacity: 1,
  },
  tabLayerHidden: {
    opacity: 0,
  },
});
