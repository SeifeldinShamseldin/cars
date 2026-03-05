import type { CarSummary, HomeCatalogResponse, SellCarsSearchParams } from "../api/catalog";
import type {
  CatalogStore,
  HomeCatalogState,
  PagedCatalogState,
  SellSearchCatalogState,
} from "./catalogStore.types";

export const createEmptyPagedState = (): PagedCatalogState => ({
  cars: [],
  nextOffset: 0,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  hasError: false,
});

export const createEmptyHomeState = (): HomeCatalogState => ({
  featuredCarIds: [],
  sellCarIds: [],
  carsById: {},
  isLoading: true,
  hasError: false,
  lastFetchedAt: 0,
});

export const createEmptySellSearchState = (): SellSearchCatalogState => ({
  cars: [],
  nextOffset: 0,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  hasError: false,
  currentParams: undefined,
});

export const buildSellSearchKey = (params: SellCarsSearchParams): string =>
  JSON.stringify({
    query: params.query?.trim() || "",
    brand: params.brand?.trim() || "",
    model: [...(params.model ?? [])].map((value) => value.trim()).filter(Boolean).sort(),
    carType: params.carType?.trim() || "",
    priceFrom: params.priceFrom,
    priceTo: params.priceTo,
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
    condition: params.condition?.trim() || "",
    transmission: params.transmission?.trim() || "",
    fuelType: params.fuelType?.trim() || "",
    mileageFrom: params.mileageFrom,
    mileageTo: params.mileageTo,
  });

export const replaceRefreshedFirstPage = (
  existing: PagedCatalogState,
  firstPage: Pick<PagedCatalogState, "cars" | "nextOffset" | "total">,
): PagedCatalogState => ({
  ...existing,
  ...firstPage,
});

export const buildHomeStateFromPaged = (
  paged: CatalogStore["paged"],
): Pick<HomeCatalogState, "featuredCarIds" | "sellCarIds" | "carsById"> | null => {
  const sellFeed = paged.SELL;
  const updateFeed = paged.UPDATE;

  if (sellFeed.cars.length === 0 && updateFeed.cars.length === 0) {
    return null;
  }

  return {
    featuredCarIds: updateFeed.cars.slice(0, 5).map((car) => car.id),
    sellCarIds: sellFeed.cars.slice(0, 5).map((car) => car.id),
    carsById: Object.fromEntries(
      [...updateFeed.cars.slice(0, 5), ...sellFeed.cars.slice(0, 5)].map((car) => [car.id, car]),
    ),
  };
};

export const applyHomeResponse = (
  state: CatalogStore,
  response: HomeCatalogResponse,
): Pick<CatalogStore, "home" | "paged"> => ({
  home: {
    ...state.home,
    featuredCarIds: response.featuredCars.map((car) => car.id),
    sellCarIds: response.sellCars.map((car) => car.id),
    carsById: Object.fromEntries(
      [...response.featuredCars, ...response.sellCars].map((car) => [car.id, car]),
    ),
    isLoading: false,
    hasError: false,
    lastFetchedAt: Date.now(),
  },
  paged: {
    SELL: {
      ...replaceRefreshedFirstPage(state.paged.SELL, response.sellFeed),
      isLoading: false,
      hasError: false,
      isLoadingMore: false,
    },
    UPDATE: {
      ...replaceRefreshedFirstPage(state.paged.UPDATE, response.updateFeed),
      isLoading: false,
      hasError: false,
      isLoadingMore: false,
    },
  },
});

export const findCarById = ({
  carId,
  home,
  paged,
  sellSearch,
}: {
  carId: string;
  home: HomeCatalogState;
  paged: CatalogStore["paged"];
  sellSearch: SellSearchCatalogState;
}): CarSummary | undefined =>
  home.carsById[carId] ??
  sellSearch.cars.find((car) => car.id === carId) ??
  paged.SELL.cars.find((car) => car.id === carId) ??
  paged.UPDATE.cars.find((car) => car.id === carId);
