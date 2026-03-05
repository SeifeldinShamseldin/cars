import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { appColors } from "../theme/paperTheme";
import { appRadii, appShadows, appSpacing } from "../theme/tokens";

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
const SHELL_HORIZONTAL_PADDING = appSpacing.xl;
const ACTIVE_BUBBLE_SIZE = 58;

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
  const hasPositionedActiveBubble = useRef(false);
  const tabLabels = {
    SELL: sellLabel,
    UPDATES: updatesLabel,
    GAMES: gamesLabel,
    PROFILE: profileLabel,
  };
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const navInnerWidth = Math.max(containerWidth - SHELL_HORIZONTAL_PADDING * 2, 0);
  const slotWidth = navInnerWidth > 0 ? navInnerWidth / tabs.length : 0;
  const targetTranslateX =
    SHELL_HORIZONTAL_PADDING +
    activeIndex * slotWidth +
    slotWidth / 2 -
    ACTIVE_BUBBLE_SIZE / 2;

  useEffect(() => {
    if (slotWidth <= 0) {
      return;
    }

    if (!hasPositionedActiveBubble.current) {
      activeTranslateX.setValue(targetTranslateX);
      hasPositionedActiveBubble.current = true;
      return;
    }

    Animated.spring(activeTranslateX, {
      toValue: targetTranslateX,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [activeTranslateX, slotWidth, targetTranslateX]);

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
              color={appColors.inkDark}
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
                accessibilityRole="button"
                accessibilityLabel={tabLabels[tab.id]}
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  source={tab.icon}
                  size={24}
                  color={isActive ? "transparent" : appColors.muted}
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
    paddingBottom: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },
  shell: {
    position: "relative",
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.background,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    paddingTop: appSpacing.xl,
    paddingBottom: appSpacing.lg,
    paddingHorizontal: SHELL_HORIZONTAL_PADDING,
    ...appShadows.lg,
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
    top: -appSpacing.md,
    backgroundColor: appColors.sand,
    alignItems: "center",
    justifyContent: "center",
    ...appShadows.md,
  },
});
