import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  type FlatList as FlatListType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { CatalogCategory, CarSummary } from "../api/catalog";
import { usePaginatedCars } from "./useCarCatalog";

const FLOATING_HEADER_TRIGGER = 132;

type UseCarsCatalogFeedParams = {
  category: CatalogCategory;
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  showHeader: boolean;
  onRefreshFeaturedCars?: () => Promise<boolean>;
};

export const useCarsCatalogFeed = ({
  category,
  featuredCars,
  sellCars,
  initialScrollOffset = 0,
  onScrollOffsetChange,
  showHeader,
  onRefreshFeaturedCars,
}: UseCarsCatalogFeedParams) => {
  const [searchText, setSearchText] = useState("");
  const headerTranslateY = useRef(new Animated.Value(-96)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const lastScrollOffset = useRef(0);
  const headerHidden = useRef(true);
  const listRef = useRef<FlatListType<CarSummary>>(null);
  const hasRestoredScroll = useRef(false);
  const { cars, isLoading, isLoadingMore, isRefreshing, hasMore, loadMore, refresh } =
    usePaginatedCars(category);

  const normalizedQuery = searchText.trim().toLowerCase();
  const matchesQuery = useCallback(
    (car: CarSummary) =>
      normalizedQuery.length === 0 ||
      [
        car.brand,
        car.model,
        car.type,
        car.description,
        car.priceLabel ?? "",
        `${car.year}`,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    [normalizedQuery],
  );

  const filteredFeaturedCars = useMemo(
    () => featuredCars.filter(matchesQuery),
    [featuredCars, matchesQuery],
  );
  const filteredSellCars = useMemo(
    () => sellCars.filter(matchesQuery),
    [matchesQuery, sellCars],
  );
  const filteredCars = useMemo(() => cars.filter(matchesQuery), [cars, matchesQuery]);

  useEffect(() => {
    if (hasRestoredScroll.current || initialScrollOffset <= 0) {
      return;
    }

    const restore = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: initialScrollOffset,
        animated: false,
      });
      lastScrollOffset.current = initialScrollOffset;
      hasRestoredScroll.current = true;
    });

    return () => {
      cancelAnimationFrame(restore);
    };
  }, [initialScrollOffset]);

  const setHeaderVisibility = useCallback(
    (hidden: boolean) => {
      if (headerHidden.current === hidden) {
        return;
      }

      headerHidden.current = hidden;
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: hidden ? -96 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: hidden ? 0 : 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [headerOpacity, headerTranslateY],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextOffset = Math.max(event.nativeEvent.contentOffset.y, 0);
      onScrollOffsetChange?.(nextOffset);

      if (!showHeader) {
        lastScrollOffset.current = nextOffset;
        return;
      }

      const delta = nextOffset - lastScrollOffset.current;

      if (nextOffset <= FLOATING_HEADER_TRIGGER) {
        setHeaderVisibility(true);
      } else if (delta > 8) {
        setHeaderVisibility(true);
      } else if (delta < -8) {
        setHeaderVisibility(false);
      }

      lastScrollOffset.current = nextOffset;
    },
    [onScrollOffsetChange, setHeaderVisibility, showHeader],
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([
      refresh(),
      onRefreshFeaturedCars ? onRefreshFeaturedCars() : Promise.resolve(false),
    ]);
  }, [onRefreshFeaturedCars, refresh]);

  return {
    searchText,
    setSearchText,
    clearSearch: () => setSearchText(""),
    headerOpacity,
    headerTranslateY,
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
  };
};
