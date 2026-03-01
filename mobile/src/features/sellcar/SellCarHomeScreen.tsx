import { CarsCatalogFeed } from "../common/CarsCatalogFeed";
import type { CarSummary } from "../../shared/api/catalog";

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
    initialScrollOffset={initialScrollOffset}
    onScrollOffsetChange={onScrollOffsetChange}
    isFeaturedCarsRefreshing={isRefreshing}
    onRefreshFeaturedCars={onRefresh}
    onOpenCar={onOpenCar}
  />
);
