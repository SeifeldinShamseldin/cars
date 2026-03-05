import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import type { CarDetail, CarSummary, CatalogCategory } from "../api/catalog";
import { useCatalogStore } from "../store/catalogStore";

const HOME_REFRESH_STALE_MS = 30 * 1000;

type UseHomeCatalogResult = {
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  isLoading: boolean;
  hasError: boolean;
};

type UsePaginatedCarsResult = {
  cars: CarSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

type UseCarDetailResult = {
  car?: CarDetail;
  isLoading: boolean;
  hasError: boolean;
};

export const useFeaturedCars = ({
  shouldRefreshWhenVisible = true,
}: {
  shouldRefreshWhenVisible?: boolean;
} = {}): UseHomeCatalogResult => {
  const { home, ensureHomeCatalog, ensureReferenceCatalog } = useCatalogStore(
    useShallow((state) => ({
      home: state.home,
      ensureHomeCatalog: state.ensureHomeCatalog,
      ensureReferenceCatalog: state.ensureReferenceCatalog,
    })),
  );
  const paged = useCatalogStore((state) => state.paged);

  useEffect(() => {
    void ensureHomeCatalog();
    void ensureReferenceCatalog().catch(() => undefined);
  }, [ensureHomeCatalog, ensureReferenceCatalog]);

  useEffect(() => {
    if (!shouldRefreshWhenVisible) {
      return;
    }

    if (Date.now() - home.lastFetchedAt < HOME_REFRESH_STALE_MS) {
      return;
    }

    void ensureHomeCatalog(true);
  }, [ensureHomeCatalog, home.lastFetchedAt, shouldRefreshWhenVisible]);

  const pagedCarsById = new Map([
    ...paged.SELL.cars.map((car) => [car.id, car] as const),
    ...paged.UPDATE.cars.map((car) => [car.id, car] as const),
  ]);

  return {
    featuredCars: home.featuredCarIds.flatMap((carId) => {
      const car = pagedCarsById.get(carId) ?? home.carsById[carId];
      return car ? [car] : [];
    }),
    sellCars: home.sellCarIds.flatMap((carId) => {
      const car = pagedCarsById.get(carId) ?? home.carsById[carId];
      return car ? [car] : [];
    }),
    isLoading: home.isLoading,
    hasError: home.hasError,
  };
};

export const usePaginatedCars = (
  category: CatalogCategory,
): UsePaginatedCarsResult => {
  const { pagedState, ensureCategoryLoaded, loadMoreCategory } = useCatalogStore(
    useShallow((state) => ({
      pagedState: state.paged[category],
      ensureCategoryLoaded: state.ensureCategoryLoaded,
      loadMoreCategory: state.loadMoreCategory,
    })),
  );

  useEffect(() => {
    void ensureCategoryLoaded(category);
  }, [category, ensureCategoryLoaded]);

  const loadMore = useCallback(() => {
    void loadMoreCategory(category);
  }, [category, loadMoreCategory]);

  return {
    cars: pagedState.cars,
    isLoading: pagedState.isLoading,
    isLoadingMore: pagedState.isLoadingMore,
    hasError: pagedState.hasError,
    hasMore: pagedState.nextOffset !== null,
    loadMore,
  };
};

export const useCarDetail = (carId?: string): UseCarDetailResult => {
  const { car, home, paged } = useCatalogStore(
    useShallow((state) => ({
      car: carId ? state.findCarById(carId) : undefined,
      home: state.home,
      paged: state.paged,
    })),
  );

  const isLoading =
    Boolean(carId) &&
    !car &&
    (home.isLoading || paged.SELL.isLoading || paged.UPDATE.isLoading);

  return {
    car,
    isLoading,
    hasError: Boolean(carId && !car && !isLoading),
  };
};
