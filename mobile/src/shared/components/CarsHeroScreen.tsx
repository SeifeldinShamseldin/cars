import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import type { CarSummary } from "../api/catalog";
import { useLoopingCarousel } from "../hooks/useLoopingCarousel";
import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { ResponsiveImage } from "./ResponsiveImage";

export type CarPanel = "FEATURED" | "SELL";

const PAGINATION_SLOT = 24;
const PAGINATION_GAP = 8;
const SCREEN_SHELL_HORIZONTAL_PADDING = 40;
const CAROUSEL_GAP = 20;

type CarsHeroScreenProps = {
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  isFeaturedCarsLoading: boolean;
  hasFeaturedCarsError: boolean;
  featuredLabel: string;
  sellLabel: string;
  featuredLoadingLabel: string;
  featuredErrorLabel: string;
  typeLabel: string;
  topSpeedLabel: string;
  torqueLabel: string;
  yearLabel: string;
  fixedPanel?: CarPanel;
  onOpenCar: (carId: string) => void;
};

export const CarsHeroScreen = ({
  featuredCars,
  sellCars,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  typeLabel,
  topSpeedLabel,
  torqueLabel,
  yearLabel,
  fixedPanel,
  onOpenCar,
}: CarsHeroScreenProps) => {
  const { width } = useWindowDimensions();
  const [panelState, setPanelState] = useState<CarPanel>(fixedPanel ?? "SELL");
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const featuredWidth = Math.max(width - SCREEN_SHELL_HORIZONTAL_PADDING, 280);
  const slideStep = featuredWidth + CAROUSEL_GAP;
  const activePanel = fixedPanel ?? panelState;
  const activeCars = activePanel === "FEATURED" ? featuredCars : sellCars;
  const { scrollRef, activeIndex, carouselItems, paginationTranslateX, onScroll, handleMomentumScrollEnd } =
    useLoopingCarousel({
      items: activeCars,
      slideStep,
      paginationStep: PAGINATION_SLOT + PAGINATION_GAP,
    });

  useEffect(() => {
    if (fixedPanel) {
      setPanelState(fixedPanel);
    }
  }, [fixedPanel]);

  useEffect(() => {
    Animated.timing(tabIndicator, {
      toValue: activePanel === "SELL" ? 0 : 1,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [activePanel, tabIndicator]);

  return (
    <View style={styles.featuredCard}>
      <View style={styles.featuredContent}>
        {fixedPanel ? null : (
          <View style={styles.heroTabs}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heroTabIndicator,
                {
                  transform: [
                    {
                      translateX: tabIndicator.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 150],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Pressable
              onPress={() => setPanelState("SELL")}
              style={[
                styles.heroTab,
                activePanel === "SELL" && styles.heroTabActive,
              ]}
            >
              <Text
                style={[
                  styles.heroTabText,
                  activePanel === "SELL" && styles.heroTabTextActive,
                ]}
              >
                {sellLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPanelState("FEATURED")}
              style={[
                styles.heroTab,
                activePanel === "FEATURED" && styles.heroTabActive,
              ]}
            >
              <Text
                style={[
                  styles.heroTabText,
                  activePanel === "FEATURED" && styles.heroTabTextActive,
                ]}
              >
                {featuredLabel}
              </Text>
            </Pressable>
          </View>
        )}
        {isFeaturedCarsLoading ? (
          <View style={styles.featuredFallbackBlock}>
            <Text style={styles.featuredLoading}>{featuredLoadingLabel}</Text>
          </View>
        ) : hasFeaturedCarsError || activeCars.length === 0 ? (
          <View style={styles.featuredFallbackBlock}>
            <Text style={styles.featuredError}>{featuredErrorLabel}</Text>
          </View>
        ) : (
          <>
            <Animated.ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideStep}
              decelerationRate={0.985}
              disableIntervalMomentum
              snapToAlignment="start"
              contentContainerStyle={styles.featuredCarouselContent}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleMomentumScrollEnd}
            >
              {carouselItems.map((featuredCar, index) => (
                <Pressable
                  key={`${featuredCar.id}-${index}`}
                  onPress={() => onOpenCar(featuredCar.id)}
                  style={[
                    styles.featuredSlide,
                    {
                      width: featuredWidth,
                      marginRight: index === carouselItems.length - 1 ? 0 : CAROUSEL_GAP,
                    },
                  ]}
                >
                  <View style={styles.featuredHeader}>
                    <Text style={styles.featuredBrand}>{featuredCar.brand}</Text>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>{featuredCar.year}</Text>
                    </View>
                  </View>
                  <View style={styles.featuredImageWrap}>
                    <Text style={styles.featuredBrandBackdrop}>{featuredCar.brand}</Text>
                    <ResponsiveImage
                      source={featuredCar.imageUrl}
                      height={220}
                    />
                    <View style={styles.featuredModelBlock}>
                      <Text style={styles.featuredModel}>{featuredCar.model}</Text>
                    </View>
                  </View>
                  <View style={styles.specStrip}>
                    <View style={styles.specStripItem}>
                      <Text style={styles.specLabel}>{typeLabel}</Text>
                      <Text style={styles.specStripValue}>{featuredCar.type}</Text>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specStripItem}>
                      <Text style={styles.specLabel}>{topSpeedLabel}</Text>
                      <Text style={styles.specStripValue}>
                        {featuredCar.topSpeedKmh} KM/H
                      </Text>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specStripItem}>
                      <Text style={styles.specLabel}>{torqueLabel}</Text>
                      <Text style={styles.specStripValue}>{featuredCar.torqueNm} NM</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </Animated.ScrollView>

            {activeCars.length > 1 ? (
              <View style={styles.paginationWrap}>
                <View style={[styles.paginationTrack, { width: activeCars.length * PAGINATION_SLOT + (activeCars.length - 1) * PAGINATION_GAP }]}>
                  <Animated.View
                    style={[
                      styles.paginationIndicator,
                      {
                        transform: [{ translateX: paginationTranslateX }],
                      },
                    ]}
                  />
                  {activeCars.map((car) => (
                    <View key={`${car.id}-page`} style={styles.paginationSlot} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  featuredCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  featuredContent: {
    gap: 14,
  },
  heroTabs: {
    position: "relative",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 999,
    backgroundColor: appColors.surfaceAlt,
    padding: 6,
  },
  heroTabIndicator: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 138,
    height: 40,
    borderRadius: 999,
    backgroundColor: appColors.primary,
  },
  heroTab: {
    minWidth: 138,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    zIndex: 1,
  },
  heroTabActive: {
    backgroundColor: "transparent",
  },
  heroTabText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  heroTabTextActive: {
    color: appColors.background,
  },
  featuredFallbackBlock: {
    minHeight: 250,
    borderRadius: 28,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  featuredLoading: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  featuredError: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  featuredCarouselContent: {
    alignItems: "stretch",
  },
  featuredSlide: {
    borderRadius: 28,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  featuredBrand: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  yearBadge: {
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  yearBadgeText: {
    color: appColors.background,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  featuredImageWrap: {
    position: "relative",
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featuredBrandBackdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    color: appColors.ink,
    opacity: 0.18,
    fontFamily: fontFamilies.displayBold,
    fontSize: 62,
    lineHeight: 62,
    textTransform: "uppercase",
  },
  featuredModelBlock: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  featuredModel: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    lineHeight: 26,
    textTransform: "uppercase",
  },
  specStrip: {
    borderTopWidth: 1,
    borderColor: appColors.ice,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "stretch",
  },
  specStripItem: {
    flex: 1,
    gap: 6,
  },
  specDivider: {
    width: 1,
    backgroundColor: appColors.ice,
    marginHorizontal: 14,
  },
  specLabel: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  specStripValue: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    lineHeight: 24,
  },
  paginationWrap: {
    alignItems: "center",
  },
  paginationTrack: {
    height: PAGINATION_SLOT,
    flexDirection: "row",
    alignItems: "center",
    gap: PAGINATION_GAP,
  },
  paginationIndicator: {
    position: "absolute",
    left: 0,
    width: PAGINATION_SLOT,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.primary,
  },
  paginationSlot: {
    width: PAGINATION_SLOT,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.inkSoft,
    opacity: 0.4,
  },
});
