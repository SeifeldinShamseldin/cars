import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FlatList as FlatListType, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import {
  fetchCarBrands,
  fetchCarModelGroups,
  type CarReferenceModelGroup,
  type CatalogCategory,
  type CarSummary,
} from "../api/catalog";
import { usePaginatedCars } from "./useCarCatalog";

type UseCarsCatalogFeedParams = {
  category: CatalogCategory;
  featuredCars: CarSummary[];
  sellCars: CarSummary[];
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  showHeader: boolean;
  onRefreshFeaturedCars?: () => Promise<boolean>;
};

type SearchFilters = {
  query: string;
  brand?: string;
  model?: string[];
  carType?: string;
  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  condition?: string;
  transmission?: string;
  fuelType?: string;
  mileageFrom?: number;
  mileageTo?: number;
};

type ActiveFilterBadge = {
  id: string;
  label: string;
};

const matchesCarType = (carType: string, selectedType: string) => {
  const normalizedCarType = carType.trim().toLowerCase();
  const normalizedSelectedType = selectedType.trim().toLowerCase();

  const aliasMap: Record<string, string[]> = {
    sedan: ["sedan", "saloon"],
    coupe: ["coupe"],
    convertible: ["convertible", "cabriolet", "cabrio", "spyder", "spider"],
    cabriolet: ["cabriolet", "cabrio", "convertible", "spyder", "spider"],
    hatchback: ["hatchback", "hatch"],
    suv: ["suv", "sport utility"],
    crossover: ["crossover"],
    wagon: ["wagon", "estate", "touring", "avant", "variant", "shooting brake"],
    estate: ["estate", "wagon", "touring", "avant", "variant", "shooting brake"],
    pickup: ["pickup", "pick-up", "truck"],
    van: ["van", "mpv", "minivan", "people carrier"],
    minivan: ["minivan", "mpv", "people carrier", "van"],
    roadster: ["roadster", "spyder", "spider"],
  };

  const aliases = aliasMap[normalizedSelectedType] ?? [normalizedSelectedType];
  return aliases.some((alias) => normalizedCarType.includes(alias));
};

const matchesFuelType = (fuelType: string, selectedFuelType: string) => {
  const normalizedFuelType = fuelType.trim().toLowerCase();
  const normalizedSelectedFuelType = selectedFuelType.trim().toLowerCase();

  const aliasMap: Record<string, string[]> = {
    reev: ["reev", "range extender", "range-extender"],
    electric: ["electric", "ev", "bev"],
    hybrid: ["hybrid", "hev"],
    "plug-in hybrid": ["plug-in hybrid", "phev", "plugin hybrid"],
    petrol: ["petrol", "gasoline", "benzine"],
    diesel: ["diesel"],
    gas: ["gas", "lpg", "cng", "ngv"],
    cng: ["cng", "ngv", "gas"],
    lpg: ["lpg", "gas"],
    hydrogen: ["hydrogen", "fuel cell", "fcev"],
    "mild hybrid": ["mild hybrid", "mhev"],
    "flex fuel": ["flex fuel", "ethanol", "e85"],
  };

  const aliases = aliasMap[normalizedSelectedFuelType] ?? [normalizedSelectedFuelType];
  return aliases.some((alias) => normalizedFuelType.includes(alias));
};

const matchesFilters = (car: CarSummary, filters: SearchFilters) => {
  const normalizedQuery = filters.query.trim().toLowerCase();

  if (normalizedQuery.length > 0) {
    const queryMatch = [
      car.brand,
      car.model,
      car.type,
      car.description,
      car.priceLabel ?? "",
      car.condition ?? "",
      car.transmission ?? "",
      car.fuelType ?? "",
      `${car.year}`,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);

    if (!queryMatch) {
      return false;
    }
  }

  if (filters.brand && car.brand !== filters.brand) {
    return false;
  }

  if (filters.model && filters.model.length > 0 && !filters.model.includes(car.model)) {
    return false;
  }

  if (filters.carType && !matchesCarType(car.type, filters.carType)) {
    return false;
  }

  if (filters.priceFrom !== undefined) {
    if (car.priceValue === undefined || car.priceValue < filters.priceFrom) {
      return false;
    }
  }

  if (filters.priceTo !== undefined) {
    if (car.priceValue === undefined || car.priceValue > filters.priceTo) {
      return false;
    }
  }

  if (filters.yearFrom && car.year < filters.yearFrom) {
    return false;
  }

  if (filters.yearTo && car.year > filters.yearTo) {
    return false;
  }

  if (filters.condition && car.condition !== filters.condition) {
    return false;
  }

  if (filters.transmission && car.transmission !== filters.transmission) {
    return false;
  }

  if (filters.fuelType && (!car.fuelType || !matchesFuelType(car.fuelType, filters.fuelType))) {
    return false;
  }

  if (filters.mileageFrom !== undefined) {
    if (car.mileage === undefined || car.mileage < filters.mileageFrom) {
      return false;
    }
  }

  if (filters.mileageTo !== undefined) {
    if (car.mileage === undefined || car.mileage > filters.mileageTo) {
      return false;
    }
  }

  return true;
};

const removeFilterFromState = (current: SearchFilters, filterId: string): SearchFilters => {
  if (filterId.startsWith("model:")) {
    const modelToRemove = filterId.slice("model:".length);
    const nextModels = (current.model ?? []).filter((model) => model !== modelToRemove);

    return {
      ...current,
      model: nextModels.length > 0 ? nextModels : undefined,
    };
  }

  switch (filterId) {
    case "brand":
      return {
        ...current,
        brand: undefined,
        model: undefined,
      };
    case "carType":
      return { ...current, carType: undefined };
    case "price":
      return { ...current, priceFrom: undefined, priceTo: undefined };
    case "year":
      return { ...current, yearFrom: undefined, yearTo: undefined };
    case "mileage":
      return { ...current, mileageFrom: undefined, mileageTo: undefined };
    case "transmission":
      return { ...current, transmission: undefined };
    case "fuelType":
      return { ...current, fuelType: undefined };
    case "condition":
      return { ...current, condition: undefined };
    default:
      return current;
  }
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
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({ query: "" });
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({ query: "" });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [referenceBrands, setReferenceBrands] = useState<string[]>([]);
  const [referenceModelGroups, setReferenceModelGroups] = useState<CarReferenceModelGroup[]>([]);
  const listRef = useRef<FlatListType<CarSummary>>(null);
  const hasRestoredScroll = useRef(false);
  const { cars, isLoading, isLoadingMore, isRefreshing, hasMore, loadMore, refresh } =
    usePaginatedCars(category);

  const allSearchableCars = useMemo(
    () =>
      [...featuredCars, ...sellCars, ...cars].filter(
        (car, index, list) => list.findIndex((item) => item.id === car.id) === index,
      ),
    [cars, featuredCars, sellCars],
  );

  const filteredFeaturedCars = useMemo(
    () => featuredCars.filter((car) => matchesFilters(car, appliedFilters)),
    [appliedFilters, featuredCars],
  );
  const filteredSellCars = useMemo(
    () => sellCars.filter((car) => matchesFilters(car, appliedFilters)),
    [appliedFilters, sellCars],
  );
  const filteredCars = useMemo(
    () => cars.filter((car) => matchesFilters(car, appliedFilters)),
    [appliedFilters, cars],
  );

  useEffect(() => {
    let cancelled = false;

    if (category !== "SELL") {
      setReferenceBrands([]);
      return () => {
        cancelled = true;
      };
    }

    void fetchCarBrands()
      .then((brands) => {
        if (!cancelled) {
          setReferenceBrands(brands);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReferenceBrands([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    let cancelled = false;

    if (category !== "SELL" || !draftFilters.brand) {
      setReferenceModelGroups([]);
      return () => {
        cancelled = true;
      };
    }

    void fetchCarModelGroups(draftFilters.brand)
      .then((groups) => {
        if (!cancelled) {
          setReferenceModelGroups(groups);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReferenceModelGroups([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, draftFilters.brand]);

  const availableBrands = useMemo(
    () =>
      category === "SELL"
        ? referenceBrands
        : [...new Set(allSearchableCars.map((car) => car.brand))]
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right)),
    [allSearchableCars, category, referenceBrands],
  );

  const availableModelGroups = useMemo(
    () =>
      category === "SELL"
        ? referenceModelGroups
        : [
            {
              groupLabel: null,
              models: [...new Set(
                (draftFilters.brand
                  ? allSearchableCars.filter((car) => car.brand === draftFilters.brand)
                  : allSearchableCars
                ).map((car) => car.model),
              )]
                .filter(Boolean)
                .sort((left, right) => left.localeCompare(right)),
            },
          ].filter((group) => group.models.length > 0),
    [allSearchableCars, category, draftFilters.brand, referenceModelGroups],
  );

  const availableModels = useMemo(
    () => availableModelGroups.flatMap((group) => group.models),
    [availableModelGroups],
  );

  const availableYears = useMemo(
    () => {
      const years: number[] = [];

      for (let year = 2026; year >= 1990; year -= 1) {
        years.push(year);
      }

      return years;
    },
    [],
  );

  const availablePrices = useMemo(
    () => {
      const prices: number[] = [];

      for (let price = 0; price <= 20_000_000; price += 100_000) {
        prices.push(price);
      }

      return prices;
    },
    [],
  );

  const availableConditions = useMemo(
    () => ["New", "Used"],
    [],
  );

  const availableCarTypes = useMemo(
    () => [
      "Sedan",
      "Coupe",
      "Convertible",
      "Cabriolet",
      "Hatchback",
      "SUV",
      "Crossover",
      "Wagon",
      "Estate",
      "Pickup",
      "Van",
      "Minivan",
      "Roadster",
    ],
    [],
  );

  const availableTransmissions = useMemo(
    () => ["Manual", "Automatic"],
    [],
  );

  const availableFuelTypes = useMemo(
    () => [
      "REEV",
      "Electric",
      "Hybrid",
      "Plug-in Hybrid",
      "Petrol",
      "Gas",
      "Mild Hybrid",
    ],
    [],
  );

  const searchPreviewText = useMemo(() => appliedFilters.query.trim(), [appliedFilters.query]);

  const activeFilterBadges = useMemo<ActiveFilterBadge[]>(() => {
    const badges: ActiveFilterBadge[] = [];

    if (appliedFilters.brand) {
      badges.push({ id: "brand", label: appliedFilters.brand });
    }

    if (appliedFilters.model && appliedFilters.model.length > 0) {
      badges.push(
        ...appliedFilters.model.map((model) => ({
          id: `model:${model}`,
          label: model,
        })),
      );
    }

    if (appliedFilters.carType) {
      badges.push({ id: "carType", label: appliedFilters.carType });
    }

    if (appliedFilters.priceFrom !== undefined || appliedFilters.priceTo !== undefined) {
      badges.push({
        id: "price",
        label: `${appliedFilters.priceFrom ?? 0}-${appliedFilters.priceTo ?? "Any"} EGP`,
      });
    }

    if (appliedFilters.yearFrom !== undefined || appliedFilters.yearTo !== undefined) {
      badges.push({
        id: "year",
        label: `${appliedFilters.yearFrom ?? "Any"}-${appliedFilters.yearTo ?? "Any"}`,
      });
    }

    if (appliedFilters.mileageFrom !== undefined || appliedFilters.mileageTo !== undefined) {
      badges.push({
        id: "mileage",
        label: `${appliedFilters.mileageFrom ?? 0}-${appliedFilters.mileageTo ?? "Any"} KM`,
      });
    }

    if (appliedFilters.transmission) {
      badges.push({ id: "transmission", label: appliedFilters.transmission });
    }

    if (appliedFilters.fuelType) {
      badges.push({ id: "fuelType", label: appliedFilters.fuelType });
    }

    if (appliedFilters.condition) {
      badges.push({ id: "condition", label: appliedFilters.condition });
    }

    return badges;
  }, [appliedFilters]);

  const hasActiveFilters = useMemo(
    () =>
      appliedFilters.query.trim().length > 0 ||
      appliedFilters.brand !== undefined ||
      (appliedFilters.model?.length ?? 0) > 0 ||
      appliedFilters.carType !== undefined ||
      appliedFilters.priceFrom !== undefined ||
      appliedFilters.priceTo !== undefined ||
      appliedFilters.yearFrom !== undefined ||
      appliedFilters.yearTo !== undefined ||
      appliedFilters.condition !== undefined ||
      appliedFilters.transmission !== undefined ||
      appliedFilters.fuelType !== undefined ||
      appliedFilters.mileageFrom !== undefined ||
      appliedFilters.mileageTo !== undefined,
    [appliedFilters],
  );

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

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextOffset = Math.max(event.nativeEvent.contentOffset.y, 0);
      onScrollOffsetChange?.(nextOffset);
    },
    [onScrollOffsetChange],
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([
      refresh(),
      onRefreshFeaturedCars ? onRefreshFeaturedCars() : Promise.resolve(false),
    ]);
  }, [onRefreshFeaturedCars, refresh]);

  return {
    searchText: searchPreviewText,
    activeFilterBadges,
    hasActiveFilters,
    isSearchOpen,
    showMoreFilters,
    draftFilters,
    availableBrands,
    availableModelGroups,
    availableModels,
    availableCarTypes,
    availablePrices,
    availableYears,
    availableConditions,
    availableTransmissions,
    availableFuelTypes,
    resetAllFilters: () =>
      setDraftFilters({
        query: "",
      }),
    resetAllAndApply: () => {
      const emptyFilters: SearchFilters = { query: "" };
      setDraftFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setIsSearchOpen(false);
    },
    removeAppliedFilter: (filterId: string) => {
      setAppliedFilters((current) => removeFilterFromState(current, filterId));
      setDraftFilters((current) => removeFilterFromState(current, filterId));
    },
    clearSearch: () =>
      setDraftFilters((current) => ({
        query: "",
        brand: current.brand,
        model: current.model,
        carType: current.carType,
        priceFrom: current.priceFrom,
        priceTo: current.priceTo,
        yearFrom: current.yearFrom,
        yearTo: current.yearTo,
        condition: current.condition,
        transmission: current.transmission,
        fuelType: current.fuelType,
        mileageFrom: current.mileageFrom,
        mileageTo: current.mileageTo,
      })),
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
    openSearch: () => {
      setDraftFilters(appliedFilters);
      setIsSearchOpen(true);
    },
    closeSearch: () => {
      setDraftFilters(appliedFilters);
      setIsSearchOpen(false);
    },
    setDraftQuery: (query: string) =>
      setDraftFilters((current) => ({
        ...current,
        query,
      })),
    setDraftBrand: (brand?: string) =>
      setDraftFilters((current) => ({
        ...current,
        brand,
        model: current.brand === brand ? current.model : [],
      })),
    toggleDraftModel: (model: string) =>
      setDraftFilters((current) => {
        const currentModels = current.model ?? [];
        const hasModel = currentModels.includes(model);

        return {
          ...current,
          model: hasModel
            ? currentModels.filter((item) => item !== model)
            : [...currentModels, model],
        };
      }),
    setDraftCarType: (carType?: string) =>
      setDraftFilters((current) => ({
        ...current,
        carType,
      })),
    setDraftPriceFrom: (priceFrom?: number) =>
      setDraftFilters((current) => ({
        ...current,
        priceFrom,
        priceTo:
          current.priceTo !== undefined &&
          priceFrom !== undefined &&
          current.priceTo < priceFrom
            ? undefined
            : current.priceTo,
      })),
    setDraftPriceTo: (priceTo?: number) =>
      setDraftFilters((current) => ({
        ...current,
        priceTo,
        priceFrom:
          current.priceFrom !== undefined &&
          priceTo !== undefined &&
          current.priceFrom > priceTo
            ? undefined
            : current.priceFrom,
      })),
    setDraftYearFrom: (yearFrom?: number) =>
      setDraftFilters((current) => ({
        ...current,
        yearFrom,
        yearTo:
          current.yearTo && yearFrom && current.yearTo < yearFrom ? undefined : current.yearTo,
      })),
    setDraftYearTo: (yearTo?: number) =>
      setDraftFilters((current) => ({
        ...current,
        yearTo,
        yearFrom:
          current.yearFrom && yearTo && current.yearFrom > yearTo ? undefined : current.yearFrom,
      })),
    setDraftMileageFrom: (mileageFrom?: number) =>
      setDraftFilters((current) => ({
        ...current,
        mileageFrom,
        mileageTo:
          current.mileageTo !== undefined &&
          mileageFrom !== undefined &&
          current.mileageTo < mileageFrom
            ? undefined
            : current.mileageTo,
      })),
    setDraftMileageTo: (mileageTo?: number) =>
      setDraftFilters((current) => ({
        ...current,
        mileageTo,
        mileageFrom:
          current.mileageFrom !== undefined &&
          mileageTo !== undefined &&
          current.mileageFrom > mileageTo
            ? undefined
            : current.mileageFrom,
      })),
    setDraftCondition: (condition?: string) =>
      setDraftFilters((current) => ({
        ...current,
        condition,
      })),
    setDraftTransmission: (transmission?: string) =>
      setDraftFilters((current) => ({
        ...current,
        transmission,
      })),
    setDraftFuelType: (fuelType?: string) =>
      setDraftFilters((current) => ({
        ...current,
        fuelType,
      })),
    toggleMoreFilters: () => setShowMoreFilters((current) => !current),
    applySearch: () => {
      setAppliedFilters(draftFilters);
      setIsSearchOpen(false);
    },
  };
};
