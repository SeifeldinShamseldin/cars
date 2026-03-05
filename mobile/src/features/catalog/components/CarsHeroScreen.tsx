import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { useLoopingCarousel } from "../../../shared/hooks/useLoopingCarousel";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

export type CarPanel = "FEATURED" | "SELL";

export type HeroSpecItem = {
  label: string;
  value: string;
};

export type HeroCardViewModel = {
  id: string;
  brand: string;
  model: string;
  year: number;
  imageUrl: string;
  description?: string;
  specItems: HeroSpecItem[];
};

type CarsHeroScreenProps = {
  featuredCars: HeroCardViewModel[];
  sellCars: HeroCardViewModel[];
  isFeaturedCarsLoading: boolean;
  hasFeaturedCarsError: boolean;
  featuredLabel: string;
  sellLabel: string;
  featuredLoadingLabel: string;
  featuredErrorLabel: string;
  fixedPanel?: CarPanel;
  onOpenCar: (carId: string) => void;
  themeVariant?: "default" | "carDetail";
};

const PAGINATION_SLOT = 24;
const PAGINATION_GAP = 8;
const SCREEN_SHELL_HORIZONTAL_PADDING = 40;
const CAROUSEL_GAP = 20;

const CARD_RADIUS = appRadii.mega;

export const CarsHeroScreen = ({
  featuredCars,
  sellCars,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  fixedPanel,
  onOpenCar,
  themeVariant = "default",
}: CarsHeroScreenProps) => {
  const { width } = useWindowDimensions();
  const [panelState, setPanelState] = useState<CarPanel>(fixedPanel ?? "SELL");
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const featuredWidth = Math.max(width - SCREEN_SHELL_HORIZONTAL_PADDING, 280);
  const slideStep = featuredWidth + CAROUSEL_GAP;
  const activePanel = fixedPanel ?? panelState;
  const isCarDetailTheme = themeVariant === "carDetail";
  const isUpdatesTheme = themeVariant === "updates";
  const activeCars = activePanel === "FEATURED" ? featuredCars : sellCars;
  const { scrollRef, carouselItems, paginationTranslateX, onScroll, handleMomentumScrollEnd } =
    useLoopingCarousel({
      items: activeCars,
      slideStep,
      paginationStep: PAGINATION_SLOT + PAGINATION_GAP,
    });

  useEffect(() => {
    if (fixedPanel) setPanelState(fixedPanel);
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
    <View style={[styles.featuredCard, isCarDetailTheme && styles.featuredCardCarDetail]}>
      <View style={styles.featuredContent}>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
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
              style={[styles.heroTab, activePanel === "SELL" && styles.heroTabActive]}
            >
              <Text style={[styles.heroTabText, activePanel === "SELL" && styles.heroTabTextActive]}>
                {sellLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPanelState("FEATURED")}
              style={[styles.heroTab, activePanel === "FEATURED" && styles.heroTabActive]}
            >
              <Text style={[styles.heroTabText, activePanel === "FEATURED" && styles.heroTabTextActive]}>
                {featuredLabel}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Loading / Error ───────────────────────────────────────────── */}
        {isFeaturedCarsLoading ? (
          <View style={[styles.featuredFallbackBlock, isCarDetailTheme && styles.featuredFallbackBlockCarDetail]}>
            <Text style={styles.featuredLoading}>{featuredLoadingLabel}</Text>
          </View>
        ) : hasFeaturedCarsError || activeCars.length === 0 ? (
          <View style={[styles.featuredFallbackBlock, isCarDetailTheme && styles.featuredFallbackBlockCarDetail]}>
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
              {carouselItems.map((car, index) => (
                <Pressable
                  key={`${car.id}-${index}`}
                  onPress={() => onOpenCar(car.id)}
                  style={[
                    styles.featuredSlide,
                    isCarDetailTheme && styles.featuredSlideCarDetail,
                    {
                      width: featuredWidth,
                      marginRight: index === carouselItems.length - 1 ? 0 : CAROUSEL_GAP,
                    },
                  ]}
                >
                  {/* ── Full-bleed photo + overlaid header (seamless) ───── */}
                  <View style={styles.photoBlock}>
                    {/* Image fills the full block */}
                    <Animated.Image
                      source={{ uri: car.imageUrl }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />

                    {/* Brand + year overlaid on top of the photo */}
                    <View style={styles.photoOverlayHeader}>
                      <Text style={styles.featuredBrand}>
                        {car.brand}
                      </Text>
                      <View style={styles.yearBadge}>
                        <Text style={styles.yearBadgeText}>
                          {car.year}
                        </Text>
                      </View>
                    </View>

                    {/* Model name overlaid at the bottom of the photo */}
                    <View style={styles.photoOverlayModel} pointerEvents="none">
                      <Text style={styles.featuredModel}>
                        {car.model}
                      </Text>
                    </View>
                  </View>

                  {/* ── Spec chips + description (fixed height body) ─── */}
                  <View style={styles.cardBody}>
                    {/* ── Spec chips ──────────────────────────────────── */}
                    <View style={styles.specStrip}>
                      {car.specItems.map((item, i) => (
                        <View
                          key={`${car.id}-${item.label}-${i}`}
                          style={[
                            styles.specChip,
                            isCarDetailTheme && styles.specChipCarDetail,
                            isUpdatesTheme && styles.specChipUpdates,
                          ]}
                        >
                          <Text
                            style={[
                              styles.specLabel,
                              isCarDetailTheme && styles.specLabelCarDetail,
                              isUpdatesTheme && styles.specLabelUpdates,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.specStripValue,
                              isCarDetailTheme && styles.specStripValueCarDetail,
                              isUpdatesTheme && styles.specStripValueUpdates,
                            ]}
                          >
                            {item.value}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* ── Description (always visible, 2 lines max, tap for full detail) ── */}
                    <Pressable
                      onPress={() => onOpenCar(car.id)}
                      style={styles.descriptionBlock}
                    >
                      <Text
                        style={[styles.descriptionText, isCarDetailTheme && styles.descriptionTextCarDetail]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {car.description ?? "Tap to view full details and specifications for this vehicle."}
                      </Text>
                      {car.description && car.description.length > 80 ? (
                        <Text style={styles.descriptionReadMore}>READ MORE ›</Text>
                      ) : null}
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </Animated.ScrollView>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {activeCars.length > 1 ? (
              <View style={styles.paginationWrap}>
                <View
                  style={[
                    styles.paginationTrack,
                    { width: activeCars.length * PAGINATION_SLOT + (activeCars.length - 1) * PAGINATION_GAP },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.paginationIndicator,
                      isCarDetailTheme && styles.paginationIndicatorCarDetail,
                      { transform: [{ translateX: paginationTranslateX }] },
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
  // ── Card shell ─────────────────────────────────────────────────────────────
  featuredCard: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: appColors.background,
  },
  featuredCardCarDetail: {
    backgroundColor: appColors.background,
  },
  featuredContent: {
    gap: appSpacing.lg2,
  },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  heroTabs: {
    position: "relative",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.lg,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.surfaceAlt,
    padding: appSpacing.sm,
    marginHorizontal: appSpacing.xxl,
    marginTop: appSpacing.xxl,
  },
  heroTabIndicator: {
    position: "absolute",
    top: appSpacing.sm, left: appSpacing.sm,
    width: 138, height: 40,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.primary,
  },
  heroTab: {
    minWidth: 138, height: 40,
    alignItems: "center", justifyContent: "center",
    borderRadius: appRadii.pill,
    zIndex: 1,
  },
  heroTabActive: { backgroundColor: "transparent" },
  heroTabText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14, lineHeight: 16,
    textTransform: "uppercase",
  },
  heroTabTextActive: { color: appColors.background },

  // ── Fallbacks ──────────────────────────────────────────────────────────────
  featuredFallbackBlock: {
    minHeight: 250,
    borderRadius: CARD_RADIUS,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: appSpacing.xxxl,
    marginHorizontal: appSpacing.xxl,
  },
  featuredFallbackBlockCarDetail: {
    backgroundColor: withAlpha(appColors.white, 0.04),
    borderColor: appColors.border,
  },
  featuredLoading: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16, lineHeight: 20, textAlign: "center",
  },
  featuredError: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16, lineHeight: 20, textAlign: "center",
  },

  // ── Carousel ───────────────────────────────────────────────────────────────
  featuredCarouselContent: {
    alignItems: "stretch",
  },

  // ── Slide card ─────────────────────────────────────────────────────────────
  featuredSlide: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    // No horizontal padding — photo is full-bleed
  },
  featuredSlideCarDetail: {
    backgroundColor: withAlpha(appColors.white, 0.04),
    borderColor: appColors.border,
  },

  // featuredHeader removed — now overlaid directly on the photo
  featuredBrand: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13, lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    // text shadow so it reads on any photo without a scrim
    textShadowColor: withAlpha(appColors.black, 0.8),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  featuredBrandCarDetail: {}, // no override needed — already white
  yearBadge: {
    borderRadius: appRadii.pill,
    // Frosted pill — legible on any photo
    backgroundColor: withAlpha(appColors.white, 0.18),
    paddingHorizontal: appSpacing.lg2, paddingVertical: appSpacing.md,
    borderWidth: 1,
    borderColor: withAlpha(appColors.white, 0.25),
  },
  yearBadgeCarDetail: {}, // no override needed
  yearBadgeText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13, lineHeight: 15,
  },
  yearBadgeTextCarDetail: {},

  // ── Full-bleed photo block ──────────────────────────────────────────────────
  photoBlock: {
    width: "100%",
    height: 280,
    position: "relative",
    overflow: "hidden",
    backgroundColor: appColors.surfaceDeep,
  },
  photoImage: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%",
    height: "100%",
  },
  // Brand + year overlaid at top — pill shadow makes text pop without a scrim
  photoOverlayHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: appSpacing.xxl,
    paddingTop: appSpacing.xl2,
    paddingBottom: appSpacing.lg,
    zIndex: 10,
  },
  // Model name overlaid at bottom — text shadow for legibility
  photoOverlayModel: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: appSpacing.xxl,
    paddingBottom: appSpacing.xl,
    paddingTop: appSpacing.lg,
    zIndex: 10,
  },

  // ── Model name (now lives inside photo overlay) ────────────────────────────
  featuredModel: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 32, lineHeight: 34,
    letterSpacing: -0.5,
    textTransform: "uppercase",
    textShadowColor: withAlpha(appColors.black, 0.9),
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  featuredModelCarDetail: {}, // already white

  // ── Card body (fixed height, no layout shift) ──────────────────────────────
  cardBody: {
    paddingHorizontal: appSpacing.xxl,
    paddingTop: appSpacing.lg2,
    paddingBottom: appSpacing.xxl,
    gap: appSpacing.lg,
  },

  // ── Spec chips ─────────────────────────────────────────────────────────────
  specStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md2,
  },

  // ── Description ────────────────────────────────────────────────────────────
  descriptionBlock: {
    gap: 4,
  },
  descriptionText: {
    color: withAlpha(appColors.white, 0.45),
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
  },
  descriptionTextCarDetail: {
    color: appColors.muted,
  },
  descriptionReadMore: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  specChip: {
    minWidth: "31%",
    flexGrow: 1,
    borderRadius: appRadii.xxl,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: appSpacing.lg,
    gap: appSpacing.sm,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  specChipCarDetail: {
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  specChipUpdates: {
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  specLabel: {
    color: withAlpha(appColors.ink, 0.68),
    fontFamily: fontFamilies.displayBold,
    fontSize: 11, lineHeight: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  specLabelCarDetail: {
    color: appColors.muted,
  },
  specLabelUpdates: {
    color: appColors.muted,
  },
  specStripValue: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18, lineHeight: 20,
  },
  specStripValueCarDetail: {
    color: appColors.white,
  },
  specStripValueUpdates: {
    color: appColors.ink,
  },

  // ── Pagination ─────────────────────────────────────────────────────────────
  paginationWrap: {
    alignItems: "center",
    paddingBottom: 4,
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
    width: PAGINATION_SLOT, height: 8,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.primary,
  },
  paginationIndicatorCarDetail: {
    backgroundColor: appColors.sand,
  },
  paginationSlot: {
    width: PAGINATION_SLOT, height: 8,
    borderRadius: appRadii.pill,
    backgroundColor: withAlpha(appColors.ink, 0.15),
  },
});
