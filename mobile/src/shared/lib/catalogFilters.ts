import {
  isSellCar,
  type CarReferenceModelGroup,
  type CarSummary,
  type SellCarsSearchParams,
} from "../api/catalog";
import type { ActiveFilterBadge } from "../../features/catalog/components/CarsCatalogFeed";
import { formatCatalogEnumLabel, formatCatalogPrice } from "./catalogPresentation";

export type SearchFilters = SellCarsSearchParams & {
  query: string;
};

export const AVAILABLE_CAR_TYPES = [
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
];

export const AVAILABLE_CONDITIONS = ["New", "Used"];
export const AVAILABLE_TRANSMISSIONS = ["Manual", "Automatic"];
export const AVAILABLE_FUEL_TYPES = [
  "REEV",
  "Electric",
  "Hybrid",
  "Plug-in Hybrid",
  "Petrol",
  "Diesel",
  "Gas",
];

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, " ");

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
  };

  const aliases = aliasMap[normalizedSelectedFuelType] ?? [normalizedSelectedFuelType];
  return aliases.some((alias) => normalizedFuelType.includes(alias));
};

export const matchesFilters = (car: CarSummary, filters: SearchFilters) => {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const sellCar = isSellCar(car) ? car : undefined;

  if (normalizedQuery.length > 0) {
    const queryMatch = [
      car.brand,
      car.model,
      formatCatalogEnumLabel(car.type),
      car.description,
      sellCar ? formatCatalogPrice(sellCar.priceValue) : "",
      sellCar ? formatCatalogEnumLabel(sellCar.condition) : "",
      sellCar ? formatCatalogEnumLabel(sellCar.transmission) : "",
      sellCar ? formatCatalogEnumLabel(sellCar.fuelType) : "",
      sellCar ? formatCatalogEnumLabel(sellCar.sellerType) : "",
      sellCar?.sellerName ?? "",
      sellCar?.telephone ?? "",
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

  if (filters.priceFrom !== undefined && (!sellCar || sellCar.priceValue < filters.priceFrom)) {
    return false;
  }

  if (filters.priceTo !== undefined && (!sellCar || sellCar.priceValue > filters.priceTo)) {
    return false;
  }

  if (filters.yearFrom && car.year < filters.yearFrom) {
    return false;
  }

  if (filters.yearTo && car.year > filters.yearTo) {
    return false;
  }

  if (
    filters.condition &&
    (!sellCar || normalizeToken(sellCar.condition) !== normalizeToken(filters.condition))
  ) {
    return false;
  }

  if (
    filters.transmission &&
    (!sellCar || normalizeToken(sellCar.transmission) !== normalizeToken(filters.transmission))
  ) {
    return false;
  }

  if (filters.fuelType && (!sellCar || !matchesFuelType(sellCar.fuelType, filters.fuelType))) {
    return false;
  }

  if (filters.mileageFrom !== undefined && (!sellCar || sellCar.mileage < filters.mileageFrom)) {
    return false;
  }

  if (filters.mileageTo !== undefined && (!sellCar || sellCar.mileage > filters.mileageTo)) {
    return false;
  }

  return true;
};

export const buildSellCarsSearchParams = (
  filters: SearchFilters,
): SellCarsSearchParams => ({
  query: filters.query.trim() || undefined,
  brand: filters.brand,
  model: filters.model,
  carType: filters.carType,
  priceFrom: filters.priceFrom,
  priceTo: filters.priceTo,
  yearFrom: filters.yearFrom,
  yearTo: filters.yearTo,
  condition: filters.condition,
  transmission: filters.transmission,
  fuelType: filters.fuelType,
  mileageFrom: filters.mileageFrom,
  mileageTo: filters.mileageTo,
});

export const removeFilterFromState = (current: SearchFilters, filterId: string): SearchFilters => {
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
      return { ...current, brand: undefined, model: undefined };
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

export const buildAvailableBrands = (
  category: "SELL" | "UPDATE",
  allSearchableCars: CarSummary[],
  referenceBrands?: string[],
) =>
  category === "SELL"
    ? referenceBrands ?? []
    : [...new Set(allSearchableCars.map((car) => car.brand))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right));

export const buildAvailableModelGroups = ({
  category,
  brand,
  allSearchableCars,
  modelGroupsByBrand,
}: {
  category: "SELL" | "UPDATE";
  brand?: string;
  allSearchableCars: CarSummary[];
  modelGroupsByBrand?: Record<string, CarReferenceModelGroup[]>;
}) =>
  category === "SELL"
    ? brand
      ? modelGroupsByBrand?.[brand.toLowerCase()] ?? []
      : []
    : [
        {
          groupLabel: null,
          models: [
            ...new Set(
              (brand
                ? allSearchableCars.filter((car) => car.brand === brand)
                : allSearchableCars
              ).map((car) => car.model),
            ),
          ]
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right)),
        },
      ].filter((group) => group.models.length > 0);

export const buildAvailableYears = () => {
  const years: number[] = [];
  for (let year = new Date().getFullYear(); year >= 1990; year -= 1) {
    years.push(year);
  }
  return years;
};

export const buildAvailablePrices = () => {
  const prices: number[] = [];
  for (let price = 0; price <= 20_000_000; price += 100_000) {
    prices.push(price);
  }
  return prices;
};

export const buildActiveFilterBadges = (filters: SearchFilters): ActiveFilterBadge[] => {
  const badges: ActiveFilterBadge[] = [];

  if (filters.brand) {
    badges.push({ id: "brand", label: filters.brand });
  }
  if (filters.model?.length) {
    badges.push(...filters.model.map((model) => ({ id: `model:${model}`, label: model })));
  }
  if (filters.carType) {
    badges.push({ id: "carType", label: filters.carType });
  }
  if (filters.priceFrom !== undefined || filters.priceTo !== undefined) {
    badges.push({
      id: "price",
      label: `${filters.priceFrom ?? 0}-${filters.priceTo ?? "Any"} EGP`,
    });
  }
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    badges.push({
      id: "year",
      label: `${filters.yearFrom ?? "Any"}-${filters.yearTo ?? "Any"}`,
    });
  }
  if (filters.mileageFrom !== undefined || filters.mileageTo !== undefined) {
    badges.push({
      id: "mileage",
      label: `${filters.mileageFrom ?? 0}-${filters.mileageTo ?? "Any"} KM`,
    });
  }
  if (filters.transmission) {
    badges.push({ id: "transmission", label: filters.transmission });
  }
  if (filters.fuelType) {
    badges.push({ id: "fuelType", label: filters.fuelType });
  }
  if (filters.condition) {
    badges.push({ id: "condition", label: filters.condition });
  }

  return badges;
};

export const hasActiveFilters = (filters: SearchFilters) =>
  filters.query.trim().length > 0 ||
  filters.brand !== undefined ||
  (filters.model?.length ?? 0) > 0 ||
  filters.carType !== undefined ||
  filters.priceFrom !== undefined ||
  filters.priceTo !== undefined ||
  filters.yearFrom !== undefined ||
  filters.yearTo !== undefined ||
  filters.condition !== undefined ||
  filters.transmission !== undefined ||
  filters.fuelType !== undefined ||
  filters.mileageFrom !== undefined ||
  filters.mileageTo !== undefined;
