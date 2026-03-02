import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import type { CatalogCategory, CarSummary } from "../api/catalog";
import { useCarsCatalogFeed } from "../hooks/useCarsCatalogFeed";
import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { CatalogHeader } from "./CatalogHeader";
import { CatalogSearchOverlay } from "./CatalogSearchOverlay";
import { CarsHeroScreen } from "./CarsHeroScreen";
import { ResponsiveImage } from "./ResponsiveImage";

type CarsCatalogFeedProps = {
  category: CatalogCategory;
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
  fixedPanel: "FEATURED" | "SELL";
  headerTitle: string;
  searchPlaceholder: string;
  quickSearchTitle?: string;
  brandLabel?: string;
  modelLabel?: string;
  carTypeLabel?: string;
  priceLabel?: string;
  priceFromLabel?: string;
  priceToLabel?: string;
  yearFilterLabel?: string;
  yearFromLabel?: string;
  yearToLabel?: string;
  mileageLabel?: string;
  mileageFromLabel?: string;
  mileageToLabel?: string;
  conditionLabel?: string;
  transmissionLabel?: string;
  fuelTypeLabel?: string;
  clearAllLabel?: string;
  offersLabel?: string;
  chooseBrandFirstLabel?: string;
  noModelsLabel?: string;
  showHeader?: boolean;
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  isFeaturedCarsRefreshing?: boolean;
  onRefreshFeaturedCars?: () => Promise<boolean>;
  onOpenCar: (carId: string) => void;
};

export const CarsCatalogFeed = ({
  category,
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
  headerTitle,
  searchPlaceholder,
  quickSearchTitle = "Quick search",
  brandLabel = "Car brand",
  modelLabel = "Car model",
  carTypeLabel = "Car type",
  priceLabel = "Price",
  priceFromLabel = "Min price",
  priceToLabel = "Max price",
  yearFilterLabel = "Year",
  yearFromLabel = "From",
  yearToLabel = "To",
  mileageLabel = "Mileage (KM)",
  mileageFromLabel = "KM from",
  mileageToLabel = "KM to",
  conditionLabel = "Condition",
  transmissionLabel = "Transmission",
  fuelTypeLabel = "Fuel type",
  clearAllLabel = "Clear all",
  offersLabel = "Offers",
  chooseBrandFirstLabel = "Choose a brand first",
  noModelsLabel = "No models found",
  showHeader = true,
  initialScrollOffset = 0,
  onScrollOffsetChange,
  isFeaturedCarsRefreshing = false,
  onRefreshFeaturedCars,
  onOpenCar,
}: CarsCatalogFeedProps) => {
  const {
    searchText,
    activeFilterBadges,
    hasActiveFilters,
    isSearchOpen,
    draftFilters,
    availableBrands,
    availableModelGroups,
    availableCarTypes,
    availablePrices,
    availableYears,
    availableConditions,
    availableTransmissions,
    availableFuelTypes,
    resetAllFilters,
    resetAllAndApply,
    removeAppliedFilter,
    clearSearch,
    openSearch,
    closeSearch,
    setDraftQuery,
    setDraftBrand,
    toggleDraftModel,
    setDraftCarType,
    setDraftPriceFrom,
    setDraftPriceTo,
    setDraftYearFrom,
    setDraftYearTo,
    setDraftMileageFrom,
    setDraftMileageTo,
    setDraftCondition,
    setDraftTransmission,
    setDraftFuelType,
    applySearch,
    listRef,
    filteredFeaturedCars,
    filteredSellCars,
    filteredCars,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadMore,
    handleScroll,
    handleRefresh,
  } = useCarsCatalogFeed({
    category,
    featuredCars,
    sellCars,
    initialScrollOffset,
    onScrollOffsetChange,
    showHeader,
    onRefreshFeaturedCars,
  });

  return (
    <View style={styles.root}>
      {showHeader ? (
        <CatalogSearchOverlay
          visible={isSearchOpen}
          title={quickSearchTitle}
          searchPlaceholder={searchPlaceholder}
          searchValue={draftFilters.query}
          brandLabel={brandLabel}
          modelLabel={modelLabel}
          carTypeLabel={carTypeLabel}
          priceLabel={priceLabel}
          priceFromLabel={priceFromLabel}
          priceToLabel={priceToLabel}
          yearLabel={yearFilterLabel}
          yearFromLabel={yearFromLabel}
          yearToLabel={yearToLabel}
          mileageLabel={mileageLabel}
          mileageFromLabel={mileageFromLabel}
          mileageToLabel={mileageToLabel}
          conditionLabel={conditionLabel}
          transmissionLabel={transmissionLabel}
          fuelTypeLabel={fuelTypeLabel}
          clearAllLabel={clearAllLabel}
          offersLabel={offersLabel}
          selectedBrand={draftFilters.brand}
          selectedModels={draftFilters.model ?? []}
          selectedCarType={draftFilters.carType}
          selectedPriceFrom={draftFilters.priceFrom}
          selectedPriceTo={draftFilters.priceTo}
          selectedYearFrom={draftFilters.yearFrom}
          selectedYearTo={draftFilters.yearTo}
          selectedMileageFrom={draftFilters.mileageFrom}
          selectedMileageTo={draftFilters.mileageTo}
          selectedCondition={draftFilters.condition}
          selectedTransmission={draftFilters.transmission}
          selectedFuelType={draftFilters.fuelType}
          availableBrands={availableBrands}
          availableModelGroups={availableModelGroups}
          availableCarTypes={availableCarTypes}
          availablePrices={availablePrices}
          availableYears={availableYears}
          availableConditions={availableConditions}
          availableTransmissions={availableTransmissions}
          availableFuelTypes={availableFuelTypes}
          chooseBrandFirstLabel={chooseBrandFirstLabel}
          noModelsLabel={noModelsLabel}
          resultCount={filteredCars.length}
          onBack={closeSearch}
          onChangeSearch={setDraftQuery}
          onClearAll={resetAllFilters}
          onClearSearch={clearSearch}
          onSelectBrand={setDraftBrand}
          onToggleModel={toggleDraftModel}
          onSelectCarType={setDraftCarType}
          onSelectPriceFrom={setDraftPriceFrom}
          onSelectPriceTo={setDraftPriceTo}
          onSelectYearFrom={setDraftYearFrom}
          onSelectYearTo={setDraftYearTo}
          onSelectMileageFrom={setDraftMileageFrom}
          onSelectMileageTo={setDraftMileageTo}
          onSelectCondition={setDraftCondition}
          onSelectTransmission={setDraftTransmission}
          onSelectFuelType={setDraftFuelType}
          onApply={applySearch}
        />
      ) : null}
      <FlatList
        ref={listRef}
        data={filteredCars}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isFeaturedCarsRefreshing}
            onRefresh={handleRefresh}
            tintColor={appColors.primary}
            colors={[appColors.primary]}
            progressBackgroundColor={appColors.surfaceAlt}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {!hasActiveFilters ? (
              <CarsHeroScreen
                featuredCars={filteredFeaturedCars}
                sellCars={filteredSellCars}
                isFeaturedCarsLoading={isFeaturedCarsLoading}
                hasFeaturedCarsError={hasFeaturedCarsError}
                featuredLabel={featuredLabel}
                sellLabel={sellLabel}
                featuredLoadingLabel={featuredLoadingLabel}
                featuredErrorLabel={featuredErrorLabel}
                typeLabel={typeLabel}
                topSpeedLabel={topSpeedLabel}
                torqueLabel={torqueLabel}
                yearLabel={yearLabel}
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
                  onChangeText={() => undefined}
                  onClear={resetAllAndApply}
                  editable={false}
                  onPress={openSearch}
                />
                {activeFilterBadges.length > 0 ? (
                  <View style={styles.activeFiltersWrap}>
                    {activeFilterBadges.map((badge) => (
                      <Pressable
                        key={badge.id}
                        style={styles.activeFilterBadge}
                        onPress={() => removeAppliedFilter(badge.id)}
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
              <Text style={styles.emptyText}>Loading cars...</Text>
            </View>
          ) : searchText.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No cars matched your search.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerState}>
              <Text style={styles.footerText}>Loading more...</Text>
            </View>
          ) : null
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            loadMore();
          }
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item: car }) => (
          <Pressable style={styles.card} onPress={() => onOpenCar(car.id)}>
            <View style={styles.imageWrap}>
              <ResponsiveImage
                source={car.imageUrl}
                height={220}
                backgroundColor="#0f131d"
              />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{car.priceLabel ?? "View details"}</Text>
                <Text style={styles.yearText}>{car.year}</Text>
              </View>

              <Text style={styles.titleText}>
                {car.brand} {car.model}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{car.type}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{car.topSpeedKmh} KM/H</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{car.torqueNm} NM</Text>
                </View>
              </View>

              <Text style={styles.descriptionText} numberOfLines={2}>
                {car.description}
              </Text>
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
  imageWrap: {
    height: 220,
    backgroundColor: "#0f131d",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaBadge: {
    borderRadius: 999,
    backgroundColor: appColors.background,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaBadgeText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
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
