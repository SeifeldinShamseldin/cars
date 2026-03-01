import { useCallback, useEffect, useState } from "react";

import {
  fetchCarDetail,
  fetchCarsPage,
  fetchHomeCatalog,
  type CarDetail,
  type CarSummary,
  type CatalogCategory,
} from "../../shared/api/catalog";

type UseHomeCatalogResult = {
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  isLoading: boolean;
  hasError: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<boolean>;
};

type UsePaginatedCarsResult = {
  cars: CarSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<boolean>;
};

type UseCarDetailResult = {
  car?: CarDetail;
  isLoading: boolean;
  hasError: boolean;
};

type HomeCatalogCache = Pick<
  UseHomeCatalogResult,
  "featuredCars" | "sellCars" | "isLoading" | "hasError"
>;

const MANUAL_REFRESH_COOLDOWN_MS = 30 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

let homeCatalogCache: HomeCatalogCache | null = null;
let homeCatalogRequest: Promise<HomeCatalogCache> | null = null;
let homeCatalogLastManualRefreshAt = 0;
let homeCatalogLastFetchedAt = 0;

const carDetailCache = new Map<string, CarDetail>();
const carDetailRequests = new Map<string, Promise<CarDetail>>();

const pagedCache = new Map<
  CatalogCategory,
  { cars: CarSummary[]; nextOffset: number | null; total: number }
>();
const pagedLastManualRefreshAt = new Map<CatalogCategory, number>();
const pagedLastFetchedAt = new Map<CatalogCategory, number>();

const loadHomeCatalog = async (force = false): Promise<HomeCatalogCache> => {
  if (homeCatalogCache && !force) {
    return homeCatalogCache;
  }

  if (!homeCatalogRequest) {
    homeCatalogRequest = fetchHomeCatalog()
      .then((response) => {
        const result: HomeCatalogCache = {
          featuredCars: response.newCars,
          sellCars: response.sellCars,
          isLoading: false,
          hasError: false,
        };
        homeCatalogCache = result;
        homeCatalogLastFetchedAt = Date.now();
        return result;
      })
      .finally(() => {
        homeCatalogRequest = null;
      });
  }

  return homeCatalogRequest;
};

const loadCarsPage = async (
  category: CatalogCategory,
  offset: number,
  limit: number,
) => {
  const page = await fetchCarsPage(category, offset, limit);
  const previous = pagedCache.get(category);
  const nextCars = offset === 0 ? page.cars : [...(previous?.cars ?? []), ...page.cars];
  const nextState = {
    cars: nextCars,
    nextOffset: page.nextOffset,
    total: page.total,
  };
  pagedCache.set(category, nextState);
  pagedLastFetchedAt.set(category, Date.now());
  return nextState;
};

const loadCarDetail = async (carId: string): Promise<CarDetail> => {
  const cached = carDetailCache.get(carId);
  if (cached) {
    return cached;
  }

  const existingRequest = carDetailRequests.get(carId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchCarDetail(carId)
    .then((car) => {
      carDetailCache.set(carId, car);
      return car;
    })
    .finally(() => {
      carDetailRequests.delete(carId);
    });

  carDetailRequests.set(carId, request);
  return request;
};

export const prefetchCarDetail = async (carId: string): Promise<void> => {
  await loadCarDetail(carId);
};

export const useFeaturedCars = (): UseHomeCatalogResult => {
  const [state, setState] = useState<HomeCatalogCache>(
    homeCatalogCache ?? {
      featuredCars: [],
      sellCars: [],
      isLoading: true,
      hasError: false,
    },
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadHomeCatalog()
      .then((result) => {
        if (!cancelled) {
          setState(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            featuredCars: [],
            sellCars: [],
            isLoading: false,
            hasError: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - homeCatalogLastFetchedAt < AUTO_REFRESH_INTERVAL_MS) {
        return;
      }

      void loadHomeCatalog(true)
        .then((result) => {
          setState(result);
        })
        .catch(() => {
          setState((previous) => ({
            ...previous,
            isLoading: false,
            hasError: true,
          }));
        });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - homeCatalogLastManualRefreshAt < MANUAL_REFRESH_COOLDOWN_MS) {
      return false;
    }

    homeCatalogLastManualRefreshAt = now;
    setIsRefreshing(true);

    try {
      const result = await loadHomeCatalog(true);
      setState(result);
      return true;
    } catch {
      setState((previous) => ({
        ...previous,
        isLoading: false,
        hasError: true,
      }));
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    ...state,
    isRefreshing,
    refresh,
  };
};

export const usePaginatedCars = (
  category: CatalogCategory,
): UsePaginatedCarsResult => {
  const cached = pagedCache.get(category);
  const [cars, setCars] = useState<CarSummary[]>(cached?.cars ?? []);
  const [nextOffset, setNextOffset] = useState<number | null>(
    cached?.nextOffset ?? 0,
  );
  const [isLoading, setIsLoading] = useState(!cached);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cachedState = pagedCache.get(category);
    if (cachedState) {
      setCars(cachedState.cars);
      setNextOffset(cachedState.nextOffset);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setHasError(false);

    void loadCarsPage(category, 0, 20)
      .then((result) => {
        if (!cancelled) {
          setCars(result.cars);
          setNextOffset(result.nextOffset);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    const interval = setInterval(() => {
      const lastFetchedAt = pagedLastFetchedAt.get(category) ?? 0;
      if (Date.now() - lastFetchedAt < AUTO_REFRESH_INTERVAL_MS) {
        return;
      }

      void loadCarsPage(category, 0, 20)
        .then((result) => {
          setCars(result.cars);
          setNextOffset(result.nextOffset);
          setIsLoading(false);
        })
        .catch(() => {
          setHasError(true);
        });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [category]);

  const loadMore = () => {
    if (nextOffset === null || isLoading || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setHasError(false);

    void loadCarsPage(category, nextOffset, 20)
      .then((result) => {
        setCars(result.cars);
        setNextOffset(result.nextOffset);
        setIsLoadingMore(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoadingMore(false);
      });
  };

  const refresh = useCallback(async () => {
    const now = Date.now();
    const lastRefreshAt = pagedLastManualRefreshAt.get(category) ?? 0;

    if (now - lastRefreshAt < MANUAL_REFRESH_COOLDOWN_MS) {
      return false;
    }

    pagedLastManualRefreshAt.set(category, now);
    setIsRefreshing(true);
    setHasError(false);

    try {
      const result = await loadCarsPage(category, 0, 20);
      setCars(result.cars);
      setNextOffset(result.nextOffset);
      setIsLoading(false);
      return true;
    } catch {
      setHasError(true);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [category]);

  return {
    cars,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasError,
    hasMore: nextOffset !== null,
    loadMore,
    refresh,
  };
};

export const useCarDetail = (carId?: string): UseCarDetailResult => {
  const [car, setCar] = useState<CarDetail | undefined>(
    carId ? carDetailCache.get(carId) : undefined,
  );
  const [isLoading, setIsLoading] = useState(Boolean(carId && !car));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!carId) {
      setCar(undefined);
      setIsLoading(false);
      setHasError(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = carDetailCache.get(carId);
    if (cached) {
      setCar(cached);
      setIsLoading(false);
      setHasError(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setHasError(false);

    void loadCarDetail(carId)
      .then((result) => {
        if (!cancelled) {
          setCar(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [carId]);

  return { car, isLoading, hasError };
};
