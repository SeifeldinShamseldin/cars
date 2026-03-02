import { CarsCatalogFeed } from "../../../shared/components/CarsCatalogFeed";
import type { CarSummary } from "../../../shared/api/catalog";

type SellCarHomeScreenProps = {
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  isLoading: boolean;
  hasError: boolean;
  featuredLabel: string;
  sellLabel: string;
  loadingLabel: string;
  errorLabel: string;
  typeLabel: string;
  topSpeedLabel: string;
  torqueLabel: string;
  yearLabel: string;
  searchPlaceholder: string;
  quickSearchTitle: string;
  brandLabel: string;
  modelLabel: string;
  carTypeLabel: string;
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  yearFilterLabel: string;
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
  chooseBrandFirstLabel: string;
  noModelsLabel: string;
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<boolean>;
  onOpenCar: (carId: string) => void;
};

export const SellCarHomeScreen = ({
  featuredCars,
  sellCars,
  isLoading,
  hasError,
  featuredLabel,
  sellLabel,
  loadingLabel,
  errorLabel,
  typeLabel,
  topSpeedLabel,
  torqueLabel,
  yearLabel,
  searchPlaceholder,
  quickSearchTitle,
  brandLabel,
  modelLabel,
  carTypeLabel,
  priceLabel,
  priceFromLabel,
  priceToLabel,
  yearFilterLabel,
  yearFromLabel,
  yearToLabel,
  mileageLabel,
  mileageFromLabel,
  mileageToLabel,
  conditionLabel,
  transmissionLabel,
  fuelTypeLabel,
  clearAllLabel,
  offersLabel,
  chooseBrandFirstLabel,
  noModelsLabel,
  initialScrollOffset,
  onScrollOffsetChange,
  isRefreshing,
  onRefresh,
  onOpenCar,
}: SellCarHomeScreenProps) => (
  <CarsCatalogFeed
    category="SELL"
    featuredCars={featuredCars}
    sellCars={sellCars}
    isFeaturedCarsLoading={isLoading}
    hasFeaturedCarsError={hasError}
    featuredLabel={featuredLabel}
    sellLabel={sellLabel}
    featuredLoadingLabel={loadingLabel}
    featuredErrorLabel={errorLabel}
    typeLabel={typeLabel}
    topSpeedLabel={topSpeedLabel}
    torqueLabel={torqueLabel}
    yearLabel={yearLabel}
    fixedPanel="SELL"
    headerTitle={sellLabel}
    searchPlaceholder={searchPlaceholder}
    quickSearchTitle={quickSearchTitle}
    brandLabel={brandLabel}
    modelLabel={modelLabel}
    carTypeLabel={carTypeLabel}
    priceLabel={priceLabel}
    priceFromLabel={priceFromLabel}
    priceToLabel={priceToLabel}
    yearFilterLabel={yearFilterLabel}
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
    chooseBrandFirstLabel={chooseBrandFirstLabel}
    noModelsLabel={noModelsLabel}
    initialScrollOffset={initialScrollOffset}
    onScrollOffsetChange={onScrollOffsetChange}
    isFeaturedCarsRefreshing={isRefreshing}
    onRefreshFeaturedCars={onRefresh}
    onOpenCar={onOpenCar}
  />
);
