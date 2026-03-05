import type { CarType, Condition, FuelType, Transmission, YesNo } from "../api/catalog";
import { formatCatalogEnumLabel } from "./catalogPresentation";

export type SellerListingOption<T extends string> = {
  label: string;
  value: T;
};

export const SELLER_BODY_TYPE_VALUES: CarType[] = [
  "SEDAN",
  "COUPE",
  "SUV",
  "HATCHBACK",
  "CONVERTIBLE",
  "CABRIOLET",
  "CROSSOVER",
  "WAGON",
  "ESTATE",
  "PICKUP",
  "VAN",
  "MINIVAN",
  "ROADSTER",
];

export const SELLER_CONDITION_VALUES: Condition[] = ["NEW", "USED"];

export const SELLER_FUEL_TYPE_VALUES: FuelType[] = [
  "PETROL",
  "DIESEL",
  "HYBRID",
  "PLUG_IN_HYBRID",
  "ELECTRIC",
  "REEV",
  "GAS",
];

export const SELLER_TRANSMISSION_VALUES: Transmission[] = ["MANUAL", "AUTOMATIC"];

export const SELLER_YES_NO_VALUES: YesNo[] = ["YES", "NO"];

export const buildSellerEnumOptions = <T extends string>(
  values: readonly T[],
): SellerListingOption<T>[] =>
  values.map((value) => ({
    value,
    label: formatCatalogEnumLabel(value),
  }));
