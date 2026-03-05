import type {
  CarReferenceCatalog,
  CarSummary,
  CatalogCategory,
  SellCarSummary,
  SellCarsSearchParams,
} from "../api/catalog";

export type HomeCatalogState = {
  featuredCarIds: string[];
  sellCarIds: string[];
  carsById: Record<string, CarSummary>;
  isLoading: boolean;
  hasError: boolean;
  lastFetchedAt: number;
};

export type PagedCatalogState = {
  cars: CarSummary[];
  nextOffset: number | null;
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
};

export type SellSearchCatalogState = {
  cars: SellCarSummary[];
  nextOffset: number | null;
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  currentParams?: SellCarsSearchParams;
};

export type CatalogStore = {
  home: HomeCatalogState;
  paged: Record<CatalogCategory, PagedCatalogState>;
  sellSearch: SellSearchCatalogState;
  referenceCatalog: CarReferenceCatalog | null;
  ensureHomeCatalog: (force?: boolean) => Promise<void>;
  ensureCategoryLoaded: (category: CatalogCategory) => Promise<void>;
  loadMoreCategory: (category: CatalogCategory) => Promise<void>;
  searchSellCars: (params: SellCarsSearchParams) => Promise<void>;
  loadMoreSellSearch: () => Promise<void>;
  clearSellSearch: () => void;
  ensureReferenceCatalog: () => Promise<CarReferenceCatalog>;
  findCarById: (carId: string) => CarSummary | undefined;
};
