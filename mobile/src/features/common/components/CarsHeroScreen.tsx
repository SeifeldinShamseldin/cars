import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";

import type { CarSummary } from "../../../shared/api/catalog";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

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
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [sellIndex, setSellIndex] = useState(0);
  const featuredScrollRef = useRef<ScrollView>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const paginationIndicator = useRef(new Animated.Value(0)).current;
  const featuredWidth = Math.max(width - SCREEN_SHELL_HORIZONTAL_PADDING, 280);
  const slideStep = featuredWidth + CAROUSEL_GAP;
  const activePanel = fixedPanel ?? panelState;
  const activeCars = activePanel === "FEATURED" ? featuredCars : sellCars;
  const activeIndex = activePanel === "FEATURED" ? featuredIndex : sellIndex;
  const carouselCars = useMemo(() => {
    if (activeCars.length <= 1) {
      return activeCars;
    }

    return [...activeCars, ...activeCars, ...activeCars];
  }, [activeCars]);

  useEffect(() => {
    if (fixedPanel) {
      setPanelState(fixedPanel);
    }
  }, [fixedPanel]);

  useEffect(() => {
    if (activeCars.length <= 1) {
      return;
    }

    const targetOffset = slideStep * activeCars.length;
    requestAnimationFrame(() => {
      featuredScrollRef.current?.scrollTo({ x: targetOffset, animated: false });
    });
  }, [activeCars.length, activePanel, slideStep]);

  useEffect(() => {
    Animated.spring(tabIndicator, {
      toValue: activePanel === "SELL" ? 0 : 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [activePanel, tabIndicator]);

  useEffect(() => {
    Animated.spring(paginationIndicator, {
      toValue: activeIndex * (PAGINATION_SLOT + PAGINATION_GAP),
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [activeIndex, paginationIndicator]);

  const handleFeaturedScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / slideStep);

    if (activeCars.length <= 1) {
      if (activePanel === "FEATURED") {
        setFeaturedIndex(0);
      } else {
        setSellIndex(0);
      }
      return;
    }

    const normalizedIndex =
      ((rawIndex % activeCars.length) + activeCars.length) % activeCars.length;
    const loopBaseIndex = activeCars.length + normalizedIndex;
    const loopOffset = loopBaseIndex * slideStep;

    if (rawIndex !== loopBaseIndex) {
      featuredScrollRef.current?.scrollTo({ x: loopOffset, animated: false });
    }

    if (activePanel === "FEATURED") {
      setFeaturedIndex(normalizedIndex);
    } else {
      setSellIndex(normalizedIndex);
    }
  };

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
            <ScrollView
              ref={featuredScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideStep}
              decelerationRate="fast"
              disableIntervalMomentum
              contentContainerStyle={styles.featuredCarouselContent}
              onMomentumScrollEnd={handleFeaturedScrollEnd}
            >
              {carouselCars.map((featuredCar, index) => (
                <Pressable
                  key={`${featuredCar.id}-${index}`}
                  onPress={() => onOpenCar(featuredCar.id)}
                  style={[
                    styles.featuredSlide,
                    {
                      width: featuredWidth,
                      marginRight: index === carouselCars.length - 1 ? 0 : CAROUSEL_GAP,
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
                    <Image
                      source={featuredCar.imageUrl}
                      style={styles.featuredImage}
                      contentFit="contain"
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
            </ScrollView>
            <View style={styles.paginationRow}>
              <View style={styles.paginationTrack}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.paginationIndicator,
                    { transform: [{ translateX: paginationIndicator }] },
                  ]}
                />
                {activeCars.map((featuredCar, index) => (
                  <View
                    key={featuredCar.id}
                    style={[
                      styles.paginationDot,
                      index === activeIndex && styles.paginationDotActiveSlot,
                      index < activeCars.length - 1 && styles.paginationDotGap,
                    ]}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  featuredCard: {},
  featuredContent: {
    gap: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  heroTabs: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroTab: {
    width: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: appColors.surfaceAlt,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTabActive: {
    backgroundColor: "transparent",
  },
  heroTabIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 140,
    backgroundColor: appColors.primary,
    borderRadius: 999,
  },
  heroTabText: {
    color: appColors.ink,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  heroTabTextActive: {
    color: appColors.primaryDeep,
  },
  featuredCarouselContent: {
    paddingRight: 0,
  },
  featuredSlide: {
    gap: 14,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  featuredBrand: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  featuredModel: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 24,
    lineHeight: 28,
    textTransform: "uppercase",
  },
  yearBadge: {
    minWidth: 64,
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  yearBadgeText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
  },
  featuredImageWrap: {
    height: 220,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    position: "relative",
    paddingTop: 12,
  },
  featuredBrandBackdrop: {
    position: "absolute",
    top: 6,
    left: 0,
    color: "rgba(244, 244, 239, 0.20)",
    fontFamily: fontFamilies.displayBold,
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: 1,
    textTransform: "uppercase",
    zIndex: 0,
  },
  featuredImage: {
    width: "100%",
    height: 146,
    zIndex: 1,
    marginTop: 32,
  },
  featuredModelBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: "flex-start",
    zIndex: 2,
  },
  specStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: appColors.ice,
    paddingVertical: 10,
  },
  specStripItem: {
    flex: 1,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 6,
  },
  specStripValue: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  specDivider: {
    width: 1,
    backgroundColor: appColors.ice,
    marginVertical: 6,
  },
  specLabel: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 10,
    lineHeight: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paginationRow: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },
  paginationTrack: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  paginationDot: {
    width: PAGINATION_SLOT,
    height: 9,
    borderRadius: 999,
    backgroundColor: appColors.ice,
  },
  paginationDotActiveSlot: {
    backgroundColor: "transparent",
  },
  paginationDotGap: {
    marginRight: PAGINATION_GAP,
  },
  paginationIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    width: PAGINATION_SLOT,
    height: 9,
    borderRadius: 999,
    backgroundColor: appColors.primary,
  },
  featuredFallbackBlock: {
    minHeight: 260,
    borderRadius: 24,
    backgroundColor: appColors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  featuredLoading: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  featuredError: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
});
