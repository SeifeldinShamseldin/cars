import type { RefObject } from "react";
import { Animated, FlatList, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Icon, Text } from "react-native-paper";

import type { CarReferenceModelGroup } from "../../../shared/api/catalog";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";
import { CatalogHeader } from "./CatalogHeader";
import {
  CarsHeroScreen,
  type CarPanel,
  type HeroCardViewModel,
} from "./CarsHeroScreen";

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
};

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
}: CarsCatalogFeedProps) => {
  const cardsLayout = hasActiveFilters ? filteredCardsLayout : defaultCardsLayout;
  const isGridLayout = cardsLayout === "grid";

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
                  <View style={styles.activeFiltersWrap}>
                    {activeFilterBadges.map((badge) => (
                      <Pressable
                        key={badge.id}
                        style={styles.activeFilterBadge}
                        onPress={() => onRemoveAppliedFilter(badge.id)}
                      >
                        <Text style={styles.activeFilterBadgeText}>{badge.label}</Text>
                        <View style={styles.activeFilterBadgeClose}>
                          <Icon source="close" size={12} color={appColors.primary} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListHeaderComponentStyle={styles.heroWrap}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{loadingLabel}</Text>
            </View>
          ) : searchText.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{emptyResultsLabel}</Text>
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
        renderItem={({ item }) => (
          <Pressable
            style={isGridLayout ? styles.gridCard : styles.card}
            onPress={() => onOpenCar(item.id)}
          >
            <View style={isGridLayout ? styles.gridImageWrap : styles.imageWrap}>
              <ResponsiveImage
                source={item.imageUrl}
                height={isGridLayout ? 132 : 220}
                backgroundColor="#0f131d"
                priority="low"
              />
            </View>

            <View style={isGridLayout ? styles.gridCardBody : styles.cardBody}>
              {isGridLayout ? (
                <>
                  <Text style={styles.gridTitleText} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.gridPriceText}>{item.primaryText}</Text>
                  <View style={styles.gridMetaRow}>
                    <View style={styles.gridMetaBadge}>
                      <Text style={styles.gridMetaBadgeText}>{item.year}</Text>
                    </View>
                    {item.metaBadges.slice(0, 2).map((badge) => (
                      <View key={`${item.id}-${badge}`} style={styles.gridMetaBadge}>
                        <Text style={styles.gridMetaBadgeText} numberOfLines={1}>
                          {badge}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{item.primaryText}</Text>
                    <Text style={styles.yearText}>{item.year}</Text>
                  </View>

                  <Text style={styles.titleText}>{item.title}</Text>

                  <View style={styles.metaRow}>
                    {item.metaBadges.map((badge) => (
                      <View key={`${item.id}-${badge}`} style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 148,
  },
  gridColumn: {
    gap: 12,
  },
  heroWrap: {
    marginBottom: 10,
  },
  headerStack: {
    gap: 10,
  },
  searchSection: {
    gap: 10,
  },
  activeFiltersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.primary,
    backgroundColor: appColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeFilterBadgeClose: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.primaryDeep,
  },
  activeFilterBadgeText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    marginBottom: 14,
  },
  gridCard: {
    flex: 1,
    maxWidth: "48.5%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    marginBottom: 14,
  },
  imageWrap: {
    height: 220,
    backgroundColor: "#0f131d",
  },
  gridImageWrap: {
    height: 132,
    backgroundColor: "#0f131d",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  gridCardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  priceText: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    lineHeight: 24,
  },
  yearText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  titleText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 24,
    lineHeight: 28,
  },
  gridTitleText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 22,
    minHeight: 44,
  },
  gridPriceText: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 20,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaBadge: {
    borderRadius: 999,
    backgroundColor: appColors.background,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gridMetaBadge: {
    borderRadius: 999,
    backgroundColor: appColors.background,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  metaBadgeText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  gridMetaBadgeText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 10,
    lineHeight: 12,
  },
  descriptionText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 20,
  },
  footerState: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  footerText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
  },
});
