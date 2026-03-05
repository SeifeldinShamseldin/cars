import { createElement, type ReactNode, type RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  type FlatList as FlatListType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { fetchSellCarsSearch, type CarSummary } from "../api/catalog";
import {
  CarsCatalogFeed,
  type CatalogFeedCardViewModel,
  type CatalogSearchOverlayLayer,
  type CarsCatalogFeedProps,
} from "../../features/catalog/components/CarsCatalogFeed";
import { CatalogSearchOverlay } from "../../features/catalog/components/CatalogSearchOverlay";
import { SellSearchResultsScreen } from "../../features/catalog/components/SellSearchResultsScreen";
import { useCatalogStore } from "../store/catalogStore";
import {
  SearchFilters,
  buildActiveFilterBadges,
  buildAvailableBrands,
  buildAvailableModelGroups,
  buildAvailablePrices,
  buildAvailableYears,
  buildSellCarsSearchParams,
  hasActiveFilters,
  matchesFilters,
  removeFilterFromState,
} from "../lib/catalogFilters";
import { buildFeedCard, buildHeroCard } from "../lib/catalogFeedMappers";
import { buildCatalogSearchOverlayProps } from "../lib/catalogSearchOverlay";
import { usePaginatedCars } from "./useCarCatalog";
import { useOverlayTransition } from "./useOverlayTransition";

export type SellCatalogFeedResult = {
  feedProps: CarsCatalogFeedProps;
  overlays: Array<{
    id: "sell-search" | "sell-search-result";
    isActive: boolean;
    opacity: CatalogSearchOverlayLayer["opacity"];
    translateY: CatalogSearchOverlayLayer["translateY"];
    onBack: () => void;
    scrollEnabled: boolean;
    swipeEnabled: boolean;
    padded?: boolean;
    safeAreaEdges?: Edge[];
    content: ReactNode;
  }>;
};

type CommonCatalogFeedParams = {
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  isFeaturedCarsLoading: boolean;
  hasFeaturedCarsError: boolean;
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  featuredLabel: string;
  sellLabel: string;
  featuredLoadingLabel: string;
  featuredErrorLabel: string;
  headerTitle: string;
  loadingLabel?: string;
  emptyResultsLabel?: string;
  loadingMoreLabel?: string;
  carTypeLabel?: string;
  priceLabel?: string;
  sellerTypeLabel?: string;
  postedAtLabel?: string;
  onOpenCar: (carId: string) => void;
  defaultCardsLayout?: "list" | "grid";
  filteredCardsLayout?: "list" | "grid";
};

export type UseSellCatalogFeedParams = CommonCatalogFeedParams & {
  searchPlaceholder: string;
  quickSearchTitle?: string;
  brandLabel?: string;
  modelLabel?: string;
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
};

export type UseUpdatesCatalogFeedParams = CommonCatalogFeedParams & {
  searchPlaceholder?: string;
};

const useCatalogFeedScroll = ({
  initialScrollOffset = 0,
  onScrollOffsetChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: {
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}) => {
  const listRef = useRef<FlatListType<CatalogFeedCardViewModel>>(null);
  const hasRestoredScroll = useRef(false);
  const loadMoreTriggeredAt = useRef<number | null>(null);

  useEffect(() => {
    if (hasRestoredScroll.current || initialScrollOffset <= 0) {
      return;
    }

    const restore = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: initialScrollOffset,
        animated: false,
      });
      hasRestoredScroll.current = true;
    });

    return () => {
      cancelAnimationFrame(restore);
    };
  }, [initialScrollOffset]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextOffset = Math.max(event.nativeEvent.contentOffset.y, 0);
      onScrollOffsetChange?.(nextOffset);

      if (!hasMore || isLoadingMore || !onLoadMore) {
        return;
      }

      const {
        contentOffset,
        contentSize,
        layoutMeasurement,
      } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom > 900) {
        return;
      }

      const triggerGate = Math.floor(contentSize.height);
      if (loadMoreTriggeredAt.current === triggerGate) {
        return;
      }

      loadMoreTriggeredAt.current = triggerGate;
      onLoadMore();
    },
    [hasMore, isLoadingMore, onLoadMore, onScrollOffsetChange],
  );

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreTriggeredAt.current = null;
    }
  }, [isLoadingMore]);

  return { listRef, onScroll };
};

const buildCatalogFeedProps = ({
  heroFeaturedCars,
  heroSellCars,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  fixedPanel,
  headerTitle,
  searchPlaceholder,
  cards,
  isLoading,
  isLoadingMore,
  hasMore,
  loadingLabel = "Loading cars...",
  emptyResultsLabel = "No cars matched your search.",
  loadingMoreLabel = "Loading more...",
  defaultCardsLayout = "list",
  filteredCardsLayout = "list",
  showHeader,
  listRef,
  onOpenCar,
  onLoadMore,
  onScroll,
  isSearchOpen = false,
  searchText = "",
  activeFilterBadges = [],
  hasActiveFilters = false,
  searchOverlayProps,
  searchLayer,
  onResetAllAndApply = () => undefined,
  onRemoveAppliedFilter = () => undefined,
  onOpenSearch = () => undefined,
}: {
  heroFeaturedCars: CarsCatalogFeedProps["heroFeaturedCars"];
  heroSellCars: CarsCatalogFeedProps["heroSellCars"];
  isFeaturedCarsLoading: boolean;
  hasFeaturedCarsError: boolean;
  featuredLabel: string;
  sellLabel: string;
  featuredLoadingLabel: string;
  featuredErrorLabel: string;
  fixedPanel: CarsCatalogFeedProps["fixedPanel"];
  headerTitle: string;
  searchPlaceholder: string;
  cards: CatalogFeedCardViewModel[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadingLabel?: string;
  emptyResultsLabel?: string;
  loadingMoreLabel?: string;
  defaultCardsLayout?: CarsCatalogFeedProps["defaultCardsLayout"];
  filteredCardsLayout?: CarsCatalogFeedProps["filteredCardsLayout"];
  showHeader: boolean;
  listRef: RefObject<FlatListType<CatalogFeedCardViewModel> | null>;
  onOpenCar: (carId: string) => void;
  onLoadMore: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isSearchOpen?: boolean;
  searchText?: string;
  activeFilterBadges?: CarsCatalogFeedProps["activeFilterBadges"];
  hasActiveFilters?: boolean;
  searchOverlayProps?: CarsCatalogFeedProps["searchOverlayProps"];
  searchLayer?: CarsCatalogFeedProps["searchLayer"];
  onResetAllAndApply?: () => void;
  onRemoveAppliedFilter?: (filterId: string) => void;
  onOpenSearch?: () => void;
}): CarsCatalogFeedProps => ({
  isSearchOpen,
  searchOverlayProps,
  searchLayer,
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
  defaultCardsLayout,
  filteredCardsLayout,
  showHeader,
  listRef,
  onResetAllAndApply,
  onRemoveAppliedFilter,
  onOpenSearch,
  onOpenCar,
  onLoadMore,
  onScroll,
});

export const useSellCatalogFeed = ({
  featuredCars,
  sellCars,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  initialScrollOffset = 0,
  onScrollOffsetChange,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  headerTitle,
  searchPlaceholder,
  loadingLabel = "Loading cars...",
  emptyResultsLabel = "No cars matched your search.",
  loadingMoreLabel = "Loading more...",
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
  sellerTypeLabel = "Seller",
  postedAtLabel = "Posted",
  onOpenCar,
  defaultCardsLayout = "list",
  filteredCardsLayout = "list",
}: UseSellCatalogFeedParams): SellCatalogFeedResult => {
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({ query: "" });
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({ query: "" });
  const [searchPhase, setSearchPhase] = useState<"closed" | "search" | "result">("closed");
  const isSearchActive = searchPhase === "search" || searchPhase === "result";
  const isResultActive = searchPhase === "result";
  const shouldMountSearch = searchPhase !== "closed";
  const searchTransition = useOverlayTransition(isSearchActive);
  const resultTransition = useOverlayTransition(isResultActive);
  const { cars, isLoading, isLoadingMore, hasMore, loadMore } = usePaginatedCars("SELL");
  const {
    referenceCatalog,
    sellSearch,
    searchSellCars,
    loadMoreSellSearch,
    clearSellSearch,
  } = useCatalogStore(
    useShallow((state) => ({
      referenceCatalog: state.referenceCatalog,
      sellSearch: state.sellSearch,
      searchSellCars: state.searchSellCars,
      loadMoreSellSearch: state.loadMoreSellSearch,
      clearSellSearch: state.clearSellSearch,
    })),
  );

  const allSearchableCars = useMemo(
    () =>
      [...featuredCars, ...sellCars, ...cars].filter(
        (car, index, list) => list.findIndex((item) => item.id === car.id) === index,
      ),
    [cars, featuredCars, sellCars],
  );

  const filteredCars = useMemo(
    () => cars.filter((car) => matchesFilters(car, appliedFilters)),
    [appliedFilters, cars],
  );
  const draftFilteredCarsCount = useMemo(
    () => cars.filter((car) => matchesFilters(car, draftFilters)).length,
    [cars, draftFilters],
  );
  const [draftSearchResultCount, setDraftSearchResultCount] = useState<number | undefined>();

  const availableBrands = useMemo(
    () => buildAvailableBrands("SELL", allSearchableCars, referenceCatalog?.brands),
    [allSearchableCars, referenceCatalog?.brands],
  );
  const availableModelGroups = useMemo(
    () =>
      buildAvailableModelGroups({
        category: "SELL",
        brand: draftFilters.brand,
        allSearchableCars,
        modelGroupsByBrand: referenceCatalog?.modelGroupsByBrand,
      }),
    [allSearchableCars, draftFilters.brand, referenceCatalog],
  );
  const availableYears = useMemo(buildAvailableYears, []);
  const availablePrices = useMemo(buildAvailablePrices, []);
  const activeFilterBadges = useMemo(
    () => buildActiveFilterBadges(appliedFilters),
    [appliedFilters],
  );
  const hasAppliedFilters = useMemo(
    () => hasActiveFilters(appliedFilters),
    [appliedFilters],
  );
  const appliedSearchParams = useMemo(
    () => buildSellCarsSearchParams(appliedFilters),
    [appliedFilters],
  );
  const draftSearchParams = useMemo(
    () => buildSellCarsSearchParams(draftFilters),
    [draftFilters],
  );

  useEffect(() => {
    if (!hasAppliedFilters) {
      clearSellSearch();
      return;
    }

    void searchSellCars(appliedSearchParams);
  }, [appliedSearchParams, clearSellSearch, hasAppliedFilters, searchSellCars]);

  useEffect(() => {
    if (!shouldMountSearch) {
      setDraftSearchResultCount(undefined);
      return;
    }

    if (!hasActiveFilters(draftFilters)) {
      setDraftSearchResultCount(cars.length);
      return;
    }

    let cancelled = false;
    const request = setTimeout(() => {
      void fetchSellCarsSearch(draftSearchParams, 0, 1)
        .then((page) => {
          if (!cancelled) {
            setDraftSearchResultCount(page.total);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDraftSearchResultCount(draftFilteredCarsCount);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(request);
    };
  }, [
    cars.length,
    draftFilteredCarsCount,
    draftFilters,
    draftSearchParams,
    shouldMountSearch,
  ]);

  const activeCars = hasAppliedFilters ? sellSearch.cars : cars;
  const activeIsLoading = hasAppliedFilters ? sellSearch.isLoading : isLoading;
  const activeIsLoadingMore = hasAppliedFilters ? sellSearch.isLoadingMore : isLoadingMore;
  const activeHasMore = hasAppliedFilters ? sellSearch.nextOffset !== null : hasMore;
  const activeLoadMore = hasAppliedFilters ? loadMoreSellSearch : loadMore;
  const { listRef, onScroll } = useCatalogFeedScroll({
    initialScrollOffset,
    onScrollOffsetChange,
    hasMore,
    isLoadingMore,
    onLoadMore: loadMore,
  });
  const { listRef: resultListRef, onScroll: resultOnScroll } = useCatalogFeedScroll({
    hasMore: activeHasMore,
    isLoadingMore: activeIsLoadingMore,
    onLoadMore: activeLoadMore,
  });
  const heroFeaturedCars = useMemo(
    () =>
      featuredCars.map((car) =>
        buildHeroCard({
          car,
          typeLabel: carTypeLabel,
          priceLabel,
          sellerTypeLabel,
          postedAtLabel,
        }),
      ),
    [
      carTypeLabel,
      featuredCars,
      postedAtLabel,
      priceLabel,
      sellerTypeLabel,
    ],
  );
  const heroSellCars = useMemo(
    () =>
      sellCars.map((car) =>
        buildHeroCard({
          car,
          typeLabel: carTypeLabel,
          priceLabel,
          sellerTypeLabel,
          postedAtLabel,
        }),
      ),
    [
      carTypeLabel,
      postedAtLabel,
      priceLabel,
      sellCars,
      sellerTypeLabel,
    ],
  );

  const searchOverlayProps = buildCatalogSearchOverlayProps({
    enabled: true,
    quickSearchTitle,
    searchPlaceholder,
    draftFilters,
    appliedFilters,
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
    resultCount: draftSearchResultCount ?? draftFilteredCarsCount,
    availableBrands,
    availableModelGroups,
    availablePrices,
    availableYears,
    setDraftFilters,
    setAppliedFilters,
    setIsSearchOpen: (value) => {
      const nextValue =
        typeof value === "function" ? value(searchPhase === "search") : value;
      setSearchPhase(nextValue ? "search" : "closed");
    },
  });

  const feedProps = buildCatalogFeedProps({
    heroFeaturedCars,
    heroSellCars,
    isFeaturedCarsLoading,
    hasFeaturedCarsError,
    featuredLabel,
    sellLabel,
    featuredLoadingLabel,
    featuredErrorLabel,
    fixedPanel: "SELL",
    headerTitle,
    searchPlaceholder,
    cards: cars.map((car) => buildFeedCard({ car, sellerTypeLabel, postedAtLabel })),
    isLoading,
    isLoadingMore,
    hasMore,
    loadingLabel,
    emptyResultsLabel,
    loadingMoreLabel,
    defaultCardsLayout,
    filteredCardsLayout: defaultCardsLayout,
    showHeader: true,
    listRef,
    onOpenCar,
    onLoadMore: loadMore,
    onScroll,
    isSearchOpen: shouldMountSearch,
    searchText: "",
    activeFilterBadges: [],
    hasActiveFilters: false,
    onResetAllAndApply: () => {
      const emptyFilters: SearchFilters = { query: "" };
      setDraftFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setSearchPhase("closed");
    },
    onRemoveAppliedFilter: (filterId) => {
      setAppliedFilters((current) => removeFilterFromState(current, filterId));
      setDraftFilters((current) => removeFilterFromState(current, filterId));
    },
    onOpenSearch: () => {
      setSearchPhase("search");
    },
  });
  const resultFeedProps = buildCatalogFeedProps({
    heroFeaturedCars: [],
    heroSellCars: [],
    isFeaturedCarsLoading: false,
    hasFeaturedCarsError: false,
    featuredLabel,
    sellLabel,
    featuredLoadingLabel,
    featuredErrorLabel,
    fixedPanel: "SELL",
    headerTitle,
    searchPlaceholder,
    cards: activeCars.map((car) => buildFeedCard({ car, sellerTypeLabel, postedAtLabel })),
    isLoading: activeIsLoading,
    isLoadingMore: activeIsLoadingMore,
    hasMore: activeHasMore,
    loadingLabel,
    emptyResultsLabel,
    loadingMoreLabel,
    defaultCardsLayout: "list",
    filteredCardsLayout: "list",
    showHeader: false,
    listRef: resultListRef,
    onOpenCar,
    onLoadMore: activeLoadMore,
    onScroll: resultOnScroll,
    isSearchOpen: false,
    searchText: appliedFilters.query.trim(),
    activeFilterBadges,
    hasActiveFilters: true,
    onResetAllAndApply: () => undefined,
    onRemoveAppliedFilter: () => undefined,
    onOpenSearch: () => undefined,
  });
  const resultSummary = useMemo(() => {
    const query = appliedFilters.query.trim();
    if (query.length > 0) {
      return `Showing results for "${query}"`;
    }

    if (activeFilterBadges.length > 0) {
      return "Showing results for your selected filters";
    }

    return undefined;
  }, [activeFilterBadges.length, appliedFilters.query]);

  const closeSearchToSell = () => {
    searchTransition.close(() => {
      setSearchPhase("closed");
    });
  };

  const dismissSearchToSell = () => {
    searchTransition.dismiss(() => {
      setSearchPhase("closed");
    });
  };

  const dismissResultToSearch = () => {
    resultTransition.dismiss(() => {
      setSearchPhase("search");
    });
  };

  const nextSearchOverlayProps = searchOverlayProps
    ? {
        ...searchOverlayProps,
        visible: shouldMountSearch,
        onBack: closeSearchToSell,
        onApply: () => {
          setAppliedFilters(draftFilters);
          if (hasActiveFilters(draftFilters)) {
            setSearchPhase("result");
            return;
          }
          setSearchPhase("closed");
        },
      }
    : undefined;

  return {
    feedProps,
    overlays: [
      ...(nextSearchOverlayProps
        ? [
            {
              id: "sell-search" as const,
              isActive: isSearchActive,
              opacity: searchTransition.opacity,
              translateY: searchTransition.translateY,
              onBack: dismissSearchToSell,
              scrollEnabled: false,
              swipeEnabled: true,
              padded: false,
              safeAreaEdges: ["left", "right"] as Edge[],
              content: createElement(CatalogSearchOverlay, nextSearchOverlayProps),
            },
          ]
        : []),
      {
        id: "sell-search-result" as const,
        isActive: isResultActive,
        opacity: resultTransition.opacity,
        translateY: resultTransition.translateY,
        onBack: dismissResultToSearch,
        scrollEnabled: false,
        swipeEnabled: true,
        padded: false,
        safeAreaEdges: ["left", "right"] as Edge[],
        content: createElement(SellSearchResultsScreen, {
          title: "Search results",
          summary: resultSummary,
          activeFilterBadges,
          onBack: dismissResultToSearch,
          feedProps: resultFeedProps,
        }),
      },
    ],
  };
};

export const useUpdatesCatalogFeed = ({
  featuredCars,
  sellCars,
  isFeaturedCarsLoading,
  hasFeaturedCarsError,
  initialScrollOffset = 0,
  onScrollOffsetChange,
  featuredLabel,
  sellLabel,
  featuredLoadingLabel,
  featuredErrorLabel,
  headerTitle,
  searchPlaceholder = "",
  loadingLabel = "Loading cars...",
  emptyResultsLabel = "No cars matched your search.",
  loadingMoreLabel = "Loading more...",
  carTypeLabel = "Car type",
  postedAtLabel = "Posted",
  sellerTypeLabel = "Seller",
  onOpenCar,
  defaultCardsLayout = "list",
  filteredCardsLayout = "list",
}: UseUpdatesCatalogFeedParams): CarsCatalogFeedProps => {
  const { cars, isLoading, isLoadingMore, hasMore, loadMore } = usePaginatedCars("UPDATE");
  const { listRef, onScroll } = useCatalogFeedScroll({
    initialScrollOffset,
    onScrollOffsetChange,
    hasMore,
    isLoadingMore,
    onLoadMore: loadMore,
  });

  return buildCatalogFeedProps({
    heroFeaturedCars: featuredCars.map((car) =>
      buildHeroCard({
        car,
        typeLabel: carTypeLabel,
        priceLabel: "",
        sellerTypeLabel,
        postedAtLabel,
      }),
    ),
    heroSellCars: [],
    isFeaturedCarsLoading,
    hasFeaturedCarsError,
    featuredLabel,
    sellLabel,
    featuredLoadingLabel,
    featuredErrorLabel,
    fixedPanel: "FEATURED",
    headerTitle,
    searchPlaceholder,
    cards: cars.map((car) => buildFeedCard({ car, sellerTypeLabel, postedAtLabel })),
    isLoading,
    isLoadingMore,
    hasMore,
    loadingLabel,
    emptyResultsLabel,
    loadingMoreLabel,
    defaultCardsLayout,
    filteredCardsLayout,
    showHeader: false,
    listRef,
    onOpenCar,
    onLoadMore: loadMore,
    onScroll,
  });
};
