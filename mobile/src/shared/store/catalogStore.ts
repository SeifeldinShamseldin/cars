import { create } from "zustand";

import {
  fetchCarReferenceCatalog,
  fetchCarsPage,
  fetchHomeCatalog,
  fetchSellCarsSearch,
  type CarUpdateSummary,
  type CarReferenceCatalog,
  type CarSummary,
  type CatalogCategory,
  type HomeCatalogResponse,
  type SellCarSummary,
} from "../api/catalog";
import {
  applyHomeResponse,
  buildHomeStateFromPaged,
  buildSellSearchKey,
  createEmptyHomeState,
  createEmptyPagedState,
  createEmptySellSearchState,
  findCarById,
} from "./catalogStore.helpers";
import type { CatalogStore } from "./catalogStore.types";

const PAGE_SIZE = 20;

let homeRequest: Promise<void> | null = null;
let referenceRequest: Promise<CarReferenceCatalog> | null = null;
const pagedRequests = new Map<CatalogCategory, Promise<void>>();
let sellSearchRequest: Promise<void> | null = null;
let sellSearchRequestKey: string | null = null;

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  home: createEmptyHomeState(),
  paged: {
    SELL: createEmptyPagedState(),
    UPDATE: createEmptyPagedState(),
  },
  sellSearch: createEmptySellSearchState(),
  referenceCatalog: null,

  ensureHomeCatalog: async (force = false) => {
    const { home, paged } = get();
    if (!force && (home.featuredCarIds.length > 0 || home.sellCarIds.length > 0)) {
      return;
    }

    if (homeRequest) {
      return homeRequest;
    }

    set((state) => ({
      home: {
        ...state.home,
        isLoading:
          state.home.featuredCarIds.length === 0 && state.home.sellCarIds.length === 0,
        hasError: false,
      },
    }));

    homeRequest = fetchHomeCatalog()
      .then((response) => {
        set((state) => applyHomeResponse(state, response));
      })
      .catch(async () => {
        const cachedFallback = buildHomeStateFromPaged(get().paged);
        if (cachedFallback) {
          set((state) => ({
            home: {
              ...state.home,
              ...cachedFallback,
              isLoading: false,
              hasError: false,
              lastFetchedAt: Date.now(),
            },
          }));
          return;
        }

        const [sellFeed, updateFeed] = await Promise.all([
          fetchCarsPage("SELL", 0, PAGE_SIZE),
          fetchCarsPage("UPDATE", 0, PAGE_SIZE),
        ]);

        const response: HomeCatalogResponse = {
          featuredCars: updateFeed.cars.slice(0, 5) as CarUpdateSummary[],
          sellCars: sellFeed.cars.slice(0, 5) as SellCarSummary[],
          sellFeed: sellFeed as HomeCatalogResponse["sellFeed"],
          updateFeed: updateFeed as HomeCatalogResponse["updateFeed"],
        };

        set((state) => applyHomeResponse(state, response));
      })
      .catch(() => {
        set((state) => ({
          home: {
            ...state.home,
            isLoading: false,
            hasError: true,
          },
        }));
      })
      .finally(() => {
        homeRequest = null;
      });

    return homeRequest;
  },

  ensureCategoryLoaded: async (category) => {
    const pagedState = get().paged[category];
    if (pagedState.cars.length > 0 || pagedState.isLoading) {
      return;
    }

    if (pagedRequests.has(category)) {
      return pagedRequests.get(category);
    }

    set((state) => ({
      paged: {
        ...state.paged,
        [category]: {
          ...state.paged[category],
          isLoading: true,
          hasError: false,
        },
      },
    }));

    const request = get()
      .ensureHomeCatalog()
      .then(async () => {
        const seeded = get().paged[category];
        if (seeded.cars.length > 0) {
          return;
        }

        const page = await fetchCarsPage(category, 0, PAGE_SIZE);
        set((state) => ({
          paged: {
            ...state.paged,
            [category]: {
              ...state.paged[category],
              cars: page.cars,
              nextOffset: page.nextOffset,
              total: page.total,
              isLoading: false,
              hasError: false,
            },
          },
        }));
      })
      .catch(() => {
        set((state) => ({
          paged: {
            ...state.paged,
            [category]: {
              ...state.paged[category],
              isLoading: false,
              hasError: true,
            },
          },
        }));
      })
      .finally(() => {
        pagedRequests.delete(category);
      });

    pagedRequests.set(category, request);
    return request;
  },

  loadMoreCategory: async (category) => {
    const pagedState = get().paged[category];
    if (
      pagedState.nextOffset === null ||
      pagedState.isLoading ||
      pagedState.isLoadingMore
    ) {
      return;
    }

    set((state) => ({
      paged: {
        ...state.paged,
        [category]: {
          ...state.paged[category],
          isLoadingMore: true,
          hasError: false,
        },
      },
    }));

    try {
      const page = await fetchCarsPage(category, pagedState.nextOffset, PAGE_SIZE);
      set((state) => ({
        paged: {
          ...state.paged,
          [category]: {
            ...state.paged[category],
            cars: [...state.paged[category].cars, ...page.cars],
            nextOffset: page.nextOffset,
            total: page.total,
            isLoading: false,
            isLoadingMore: false,
            hasError: false,
          },
        },
      }));
    } catch {
      set((state) => ({
        paged: {
          ...state.paged,
          [category]: {
            ...state.paged[category],
            isLoadingMore: false,
            hasError: true,
          },
        },
      }));
    }
  },

  searchSellCars: async (params) => {
    const requestKey = buildSellSearchKey(params);
    const currentSearch = get().sellSearch;
    if (
      currentSearch.currentParams &&
      buildSellSearchKey(currentSearch.currentParams) === requestKey &&
      (currentSearch.isLoading || currentSearch.cars.length > 0)
    ) {
      return sellSearchRequest ?? Promise.resolve();
    }

    if (sellSearchRequest && sellSearchRequestKey === requestKey) {
      return sellSearchRequest;
    }

    set(() => ({
      sellSearch: {
        ...createEmptySellSearchState(),
        isLoading: true,
        hasError: false,
        currentParams: params,
      },
    }));

    const request = fetchSellCarsSearch(params, 0, PAGE_SIZE)
      .then((page) => {
        const activeParams = get().sellSearch.currentParams;
        if (!activeParams || buildSellSearchKey(activeParams) !== requestKey) {
          return;
        }

        set((state) => ({
          sellSearch: {
            ...state.sellSearch,
            cars: page.cars,
            nextOffset: page.nextOffset,
            total: page.total,
            isLoading: false,
            isLoadingMore: false,
            hasError: false,
          },
        }));
      })
      .catch(() => {
        const activeParams = get().sellSearch.currentParams;
        if (!activeParams || buildSellSearchKey(activeParams) !== requestKey) {
          return;
        }

        set((state) => ({
          sellSearch: {
            ...state.sellSearch,
            isLoading: false,
            isLoadingMore: false,
            hasError: true,
          },
        }));
      })
      .finally(() => {
        if (sellSearchRequestKey === requestKey) {
          sellSearchRequest = null;
          sellSearchRequestKey = null;
        }
      });

    sellSearchRequest = request;
    sellSearchRequestKey = requestKey;
    return request;
  },

  loadMoreSellSearch: async () => {
    const currentSearch = get().sellSearch;
    if (
      !currentSearch.currentParams ||
      currentSearch.nextOffset === null ||
      currentSearch.isLoading ||
      currentSearch.isLoadingMore
    ) {
      return;
    }

    const requestKey = buildSellSearchKey(currentSearch.currentParams);

    set((state) => ({
      sellSearch: {
        ...state.sellSearch,
        isLoadingMore: true,
        hasError: false,
      },
    }));

    try {
      const page = await fetchSellCarsSearch(
        currentSearch.currentParams,
        currentSearch.nextOffset,
        PAGE_SIZE,
      );
      const activeParams = get().sellSearch.currentParams;
      if (!activeParams || buildSellSearchKey(activeParams) !== requestKey) {
        return;
      }

      set((state) => ({
        sellSearch: {
          ...state.sellSearch,
          cars: [...state.sellSearch.cars, ...page.cars],
          nextOffset: page.nextOffset,
          total: page.total,
          isLoadingMore: false,
          hasError: false,
        },
      }));
    } catch {
      const activeParams = get().sellSearch.currentParams;
      if (!activeParams || buildSellSearchKey(activeParams) !== requestKey) {
        return;
      }

      set((state) => ({
        sellSearch: {
          ...state.sellSearch,
          isLoadingMore: false,
          hasError: true,
        },
      }));
    }
  },

  clearSellSearch: () => {
    set({ sellSearch: createEmptySellSearchState() });
  },

  ensureReferenceCatalog: async () => {
    const cached = get().referenceCatalog;
    if (cached) {
      return cached;
    }

    if (!referenceRequest) {
      referenceRequest = fetchCarReferenceCatalog()
        .then((referenceCatalog) => {
          set({ referenceCatalog });
          return referenceCatalog;
        })
        .catch(() => {
          set({ referenceCatalog: null });
          throw new Error("Failed to load reference catalog");
        })
        .finally(() => {
          referenceRequest = null;
        });
    }

    return referenceRequest;
  },

  findCarById: (carId) => {
    const { home, paged, sellSearch } = get();
    return findCarById({ carId, home, paged, sellSearch });
  },
}));
