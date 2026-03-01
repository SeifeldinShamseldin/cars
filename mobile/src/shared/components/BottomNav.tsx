import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { appColors } from "../theme/paperTheme";

export type BottomNavTab = "SELL" | "UPDATES" | "GAMES" | "PROFILE";

type BottomNavProps = {
  activeTab: BottomNavTab;
  sellLabel: string;
  updatesLabel: string;
  gamesLabel: string;
  profileLabel: string;
  onTabChange: (tab: BottomNavTab) => void;
};

const tabs = [
  { id: "SELL" as const, icon: "car-info" },
  { id: "UPDATES" as const, icon: "newspaper-variant-outline" },
  { id: "GAMES" as const, icon: "gamepad-variant-outline" },
  { id: "PROFILE" as const, icon: "account-outline" },
];
const SHELL_HORIZONTAL_PADDING = 16;
const ACTIVE_BUBBLE_SIZE = 60;

export const BottomNav = ({
  activeTab,
  sellLabel,
  updatesLabel,
  gamesLabel,
  profileLabel,
  onTabChange,
}: BottomNavProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const activeTranslateX = useRef(new Animated.Value(0)).current;
  void sellLabel;
  void updatesLabel;
  void gamesLabel;
  void profileLabel;
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const navInnerWidth = Math.max(containerWidth - SHELL_HORIZONTAL_PADDING * 2, 0);
  const slotWidth = navInnerWidth > 0 ? navInnerWidth / tabs.length : 0;

  useEffect(() => {
    if (slotWidth <= 0) {
      return;
    }

    Animated.spring(activeTranslateX, {
      toValue:
        SHELL_HORIZONTAL_PADDING +
        activeIndex * slotWidth +
        slotWidth / 2 -
        ACTIVE_BUBBLE_SIZE / 2,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [activeIndex, activeTranslateX, slotWidth]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.shell} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
        {slotWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
              style={[
                styles.activeBubble,
                {
                  width: ACTIVE_BUBBLE_SIZE,
                  height: ACTIVE_BUBBLE_SIZE,
                  borderRadius: ACTIVE_BUBBLE_SIZE / 2,
                  transform: [{ translateX: activeTranslateX }],
                },
              ]}
          >
            <Icon
              source={tabs[activeIndex]?.icon ?? tabs[0].icon}
              size={26}
              color={appColors.primaryDeep}
            />
          </Animated.View>
        ) : null}

        <View style={styles.row}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <Pressable
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={styles.tab}
              >
                <Icon
                  source={tab.icon}
                  size={24}
                  color={isActive ? "transparent" : appColors.inkSoft}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },
  shell: {
    position: "relative",
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: SHELL_HORIZONTAL_PADDING,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBubble: {
    position: "absolute",
    top: -10,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
});
