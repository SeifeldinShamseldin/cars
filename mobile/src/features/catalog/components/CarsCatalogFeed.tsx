import type { RefObject } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Icon, Text } from "react-native-paper";

import type { CarReferenceModelGroup } from "../../../shared/api/catalog";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";
import { CatalogHeader } from "./CatalogHeader";
import {
  CarsHeroScreen,
  type CarPanel,
  type HeroCardViewModel,
} from "./CarsHeroScreen";

const CARD_RADIUS = appRadii.xxxl;

// ─── Types (unchanged) ────────────────────────────────────────────────────────
export type ActiveFilterBadge = {
  id: string;
  label: string;
};

export type CatalogFeedCardViewModel = {
  id: string;
  imageUrl: string;
  primaryText: string;
  year: number;
  title: string;
  metaBadges: string[];
  description: string;
};

export type CatalogSearchOverlayViewModel = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  brandLabel: string;
  modelLabel: string;
  carTypeLabel: string;
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  yearLabel: string;
  yearFromLabel: string;
  yearToLabel: string;
  mileageLabel: string;
  mileageFromLabel: string;
  mileageToLabel: string;
  conditionLabel: string;
  transmissionLabel: string;
  fuelTypeLabel: string;
  clearAllLabel: string;
  offersLabel: string;
  selectedBrand?: string;
  selectedModels: string[];
  selectedCarType?: string;
  selectedPriceFrom?: number;
  selectedPriceTo?: number;
  selectedYearFrom?: number;
  selectedYearTo?: number;
  selectedMileageFrom?: number;
  selectedMileageTo?: number;
  selectedCondition?: string;
  selectedTransmission?: string;
  selectedFuelType?: string;
  availableBrands: string[];
  availableModelGroups: CarReferenceModelGroup[];
  availableCarTypes: string[];
  availablePrices: number[];
  availableYears: number[];
  availableConditions: string[];
  availableTransmissions: string[];
  availableFuelTypes: string[];
  chooseBrandFirstLabel: string;
  noModelsLabel: string;
  resultCount: number;
  onBack: () => void;
  onChangeSearch: (value: string) => void;
  onClearAll: () => void;
  onClearSearch: () => void;
  onSelectBrand: (value?: string) => void;
  onToggleModel: (value: string) => void;
  onSelectCarType: (value?: string) => void;
  onSelectPriceFrom: (value?: number) => void;
  onSelectPriceTo: (value?: number) => void;
  onSelectYearFrom: (value?: number) => void;
  onSelectYearTo: (value?: number) => void;
  onSelectMileageFrom: (value?: number) => void;
  onSelectMileageTo: (value?: number) => void;
  onSelectCondition: (value?: string) => void;
  onSelectTransmission: (value?: string) => void;
  onSelectFuelType: (value?: string) => void;
  onApply: () => void;
};

type AnimatedScalar = Animated.Value | Animated.AnimatedInterpolation<number>;

export type CatalogSearchOverlayLayer = {
  isActive: boolean;
  opacity: AnimatedScalar;
  translateY: AnimatedScalar;
  onBack: () => void;
  swipeEnabled: boolean;
};

export type CatalogFeedThemeVariant = "default" | "carDetail" | "updates";

export type CarsCatalogFeedProps = {
  isSearchOpen: boolean;
  searchOverlayProps?: CatalogSearchOverlayViewModel;
  searchLayer?: CatalogSearchOverlayLayer;
  searchText: string;
  activeFilterBadges: ActiveFilterBadge[];
  hasActiveFilters: boolean;
  isFeaturedCarsLoading: boolean;
  hasFeaturedCarsError: boolean;
  featuredLabel: string;
  sellLabel: string;
  featuredLoadingLabel: string;
  featuredErrorLabel: string;
  heroFeaturedCars: HeroCardViewModel[];
  heroSellCars: HeroCardViewModel[];
  fixedPanel: CarPanel;
  headerTitle: string;
  searchPlaceholder: string;
  cards: CatalogFeedCardViewModel[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadingLabel: string;
  emptyResultsLabel: string;
  loadingMoreLabel: string;
  defaultCardsLayout?: "list" | "grid";
  filteredCardsLayout?: "list" | "grid";
  showHeader?: boolean;
  listRef?: RefObject<FlatList<CatalogFeedCardViewModel> | null>;
  onResetAllAndApply: () => void;
  onRemoveAppliedFilter: (filterId: string) => void;
  onOpenSearch: () => void;
  onOpenCar: (carId: string) => void;
  onLoadMore: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  themeVariant?: CatalogFeedThemeVariant;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const CarsCatalogFeed = ({
  searchText,
  activeFilterBadges,
  hasActiveFilters,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  heroFeaturedCars,
  heroSellCars,
  fixedPanel,
  headerTitle,
  searchPlaceholder,
  cards,
  isLoading,
  isLoadingMore,
  hasMore,
  loadingLabel,
  emptyResultsLabel,
  loadingMoreLabel,
  defaultCardsLayout = "list",
  filteredCardsLayout = "list",
  showHeader = true,
  listRef,
  onResetAllAndApply,
  onRemoveAppliedFilter,
  onOpenSearch,
  onOpenCar,
  onLoadMore,
  onScroll,
  themeVariant = "default",
}: CarsCatalogFeedProps) => {
  const cardsLayout = hasActiveFilters ? filteredCardsLayout : defaultCardsLayout;
  const isGridLayout = cardsLayout === "grid";
  const isUpdatesTheme = themeVariant === "updates";
  const badgeBackgroundColor = isUpdatesTheme ? appColors.surfaceAlt : appColors.primary;
  const badgeTextColor = isUpdatesTheme ? appColors.ink : appColors.inkDark;
  const gridPrimaryColor = isUpdatesTheme ? appColors.ink : appColors.primary;

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        key={cardsLayout}
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={isGridLayout ? 2 : 1}
        columnWrapperStyle={isGridLayout ? styles.gridColumn : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {!hasActiveFilters ? (
              <CarsHeroScreen
                featuredCars={heroFeaturedCars}
                sellCars={heroSellCars}
                isFeaturedCarsLoading={isFeaturedCarsLoading}
                hasFeaturedCarsError={hasFeaturedCarsError}
                featuredLabel={featuredLabel}
                sellLabel={sellLabel}
                featuredLoadingLabel={featuredLoadingLabel}
                featuredErrorLabel={featuredErrorLabel}
                fixedPanel={fixedPanel}
                onOpenCar={onOpenCar}
                themeVariant={themeVariant}
              />
            ) : null}

            {showHeader ? (
              <View style={styles.searchSection}>
                <CatalogHeader
                  title={headerTitle}
                  searchPlaceholder={searchPlaceholder}
                  value={searchText}
                  onClear={onResetAllAndApply}
                  editable={false}
                  onPress={onOpenSearch}
                />

                {activeFilterBadges.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterBadgesWrap}
                  >
                    {activeFilterBadges.map((badge) => (
                      <Pressable
                        key={badge.id}
                        style={styles.filterBadge}
                        onPress={() => onRemoveAppliedFilter(badge.id)}
                      >
                        <Text style={styles.filterBadgeText}>{badge.label}</Text>
                        <View style={styles.filterBadgeClose}>
                          <Icon source="close" size={11} color={appColors.inkDark} />
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListHeaderComponentStyle={styles.heroWrap}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.stateText}>{loadingLabel}</Text>
            </View>
          ) : searchText.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.stateText}>{emptyResultsLabel}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerState}>
              <Text style={styles.footerText}>{loadingMoreLabel}</Text>
            </View>
          ) : null
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) =>
          isGridLayout ? (
            // ── GRID CARD ─────────────────────────────────────────────────
            <Pressable style={styles.gridCard} onPress={() => onOpenCar(item.id)}>
              {/* Full-bleed photo with year + title overlay */}
              <View style={styles.gridPhotoBlock}>
                <Animated.Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridPhotoImage}
                  resizeMode="cover"
                />

                {/* Year badge top-right */}
                <View style={styles.gridYearBadge} pointerEvents="none">
                  <Text style={styles.gridYearText}>{item.year}</Text>
                </View>

                {/* Title at bottom of photo */}
                <View style={styles.gridTitleOverlay} pointerEvents="none">
                  <Text style={styles.gridTitleText} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* Card body: price + meta badges */}
              <View style={styles.gridCardBody}>
                <Text style={[styles.gridPriceText, { color: gridPrimaryColor }]}>
                  {item.primaryText}
                </Text>
                <View style={styles.gridMetaRow}>
                  {item.metaBadges.slice(0, 2).map((badge) => (
                    <View key={`${item.id}-${badge}`} style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText} numberOfLines={1}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          ) : (
            // ── LIST CARD ─────────────────────────────────────────────────
            <Pressable style={styles.card} onPress={() => onOpenCar(item.id)}>

              {/* Full-bleed photo block — brand watermark + year + title overlaid */}
              <View style={styles.imageWrap}>
                <Animated.Image
                  source={{ uri: item.imageUrl }}
                  style={styles.listPhotoImage}
                  resizeMode="cover"
                />

                {/* Faint watermark year — same as CarDetailScreen */}
                <Text style={styles.imageWatermark} numberOfLines={1}>{item.year}</Text>

                {/* Bottom scrim so title overlay is readable */}
                <View style={styles.listScrimBottom} />

                {/* Price badge top-left */}
                <View
                  style={[styles.listPriceBadge, { backgroundColor: badgeBackgroundColor }]}
                  pointerEvents="none"
                >
                  <Text style={[styles.listPriceBadgeText, { color: badgeTextColor }]}>
                    {item.primaryText}
                  </Text>
                </View>

                {/* Year badge top-right */}
                <View style={styles.listYearBadge} pointerEvents="none">
                  <Text style={styles.listYearBadgeText}>{item.year}</Text>
                </View>

                {/* Title overlaid at bottom of photo */}
                <View style={styles.listTitleOverlay} pointerEvents="none">
                  <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
                </View>
              </View>

              {/* Card body: meta badges + description */}
              <View style={styles.cardBody}>
                {item.metaBadges.length > 0 ? (
                  <View style={styles.metaRow}>
                    {item.metaBadges.map((badge) => (
                      <View key={`${item.id}-${badge}`} style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {item.description ? (
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )
        }
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    paddingBottom: 148,
  },
  gridColumn: {
    gap: 12,
  },
  heroWrap: {
    marginBottom: appSpacing.md2,
  },
  headerStack: {
    gap: appSpacing.md2,
  },
  searchSection: {
    gap: appSpacing.md2,
  },

  // ── Filter badges (horizontal scroll) ────────────────────────────────────
  filterBadgesWrap: {
    flexDirection: "row",
    gap: appSpacing.md,
    paddingRight: 4,
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.sm,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.sand,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: 9,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBadgeText: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filterBadgeClose: {
    width: 18,
    height: 18,
    borderRadius: appRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha(appColors.inkDark, 0.14),
  },

  // ── LIST CARD ─────────────────────────────────────────────────────────────
  card: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 14,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },

  // Photo block — fixed height, all overlays inside
  imageWrap: {
    height: 220,
    backgroundColor: appColors.surfaceMuted,
    position: "relative",
    overflow: "hidden",
  },
  listPhotoImage: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%",
    height: "100%",
  },
  imageWatermark: {
    position: "absolute",
    bottom: -10,
    right: -8,
    color: appColors.white,
    opacity: 0.06,
    fontFamily: fontFamilies.displayBold,
    fontSize: 88,
    lineHeight: 88,
    textTransform: "uppercase",
    letterSpacing: -4,
    zIndex: 1,
  },
  listScrimBottom: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: 90,
    backgroundColor: withAlpha(appColors.scrimDark, 0.78),
    zIndex: 2,
  },
  // Price badge — top left, yellow pill
  listPriceBadge: {
    position: "absolute",
    top: 14, left: 16,
    backgroundColor: appColors.primary,
    borderRadius: appRadii.pill,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: appSpacing.md,
    zIndex: 5,
  },
  listPriceBadgeText: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
  },
  // Year badge — top right, frosted glass
  listYearBadge: {
    position: "absolute",
    top: 14, right: 16,
    backgroundColor: withAlpha(appColors.white, 0.18),
    borderRadius: appRadii.pill,
    borderWidth: 1,
    borderColor: withAlpha(appColors.white, 0.25),
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: appSpacing.md,
    zIndex: 5,
  },
  listYearBadgeText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
    textShadowColor: withAlpha(appColors.black, 0.6),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Title at bottom of photo
  listTitleOverlay: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    zIndex: 5,
  },
  titleText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 26,
    lineHeight: 30,
    textTransform: "uppercase",
    letterSpacing: -0.5,
    textShadowColor: withAlpha(appColors.black, 0.9),
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Card body below photo
  cardBody: {
    paddingHorizontal: appSpacing.xl,
    paddingTop: appSpacing.lg2,
    paddingBottom: appSpacing.xl,
    gap: appSpacing.md2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md,
  },
  metaBadge: {
    borderRadius: appRadii.pill,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: appSpacing.lg,
    paddingVertical: 7,
  },
  metaBadgeText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  descriptionText: {
    color: withAlpha(appColors.white, 0.38),
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── GRID CARD ─────────────────────────────────────────────────────────────
  gridCard: {
    flex: 1,
    maxWidth: "48.5%",
    borderRadius: appRadii.xxl2,
    overflow: "hidden",
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 14,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gridPhotoBlock: {
    height: 148,
    backgroundColor: appColors.surfaceMuted,
    position: "relative",
    overflow: "hidden",
  },
  gridPhotoImage: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%",
    height: "100%",
  },
  gridYearBadge: {
    position: "absolute",
    top: 10, right: 10,
    backgroundColor: withAlpha(appColors.white, 0.18),
    borderRadius: appRadii.pill,
    borderWidth: 1,
    borderColor: withAlpha(appColors.white, 0.22),
    paddingHorizontal: appSpacing.md2,
    paddingVertical: 5,
    zIndex: 5,
  },
  gridYearText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textShadowColor: withAlpha(appColors.black, 0.7),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gridTitleOverlay: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    zIndex: 5,
  },
  gridTitleText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: -0.3,
    textShadowColor: withAlpha(appColors.black, 0.9),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  gridCardBody: {
    paddingHorizontal: appSpacing.lg,
    paddingTop: appSpacing.md2,
    paddingBottom: appSpacing.lg,
    gap: appSpacing.md,
  },
  gridPriceText: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 20,
  },
  gridMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.sm,
  },

  // ── State views ───────────────────────────────────────────────────────────
  emptyState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 20,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  footerState: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  footerText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    opacity: 0.6,
  },
});
