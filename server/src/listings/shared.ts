import type {
  CarType,
  Condition,
  FuelType,
  SellerType,
  Transmission,
  YesNo,
} from "../data/demoCars";
import { getCatalogReferenceCatalog } from "../data/catalogSqlite";

export type ListingStatus = "PENDING" | "APPROVED" | "REJECTED";
export type FeaturedRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type ListingBodyType = CarType;
export type ListingCondition = Condition;
export type ListingFuelType = FuelType;
export type ListingTransmission = Transmission;
export type ListingSellerType = SellerType;
export type ListingYesNo = YesNo;

export type ListingFormInput = {
  brand: string;
  model: string;
  sellerName: string;
  telephone: string;
  sellerType: ListingSellerType;
  bodyType: ListingBodyType;
  year: number;
  priceValue: number;
  condition: ListingCondition;
  fuelType: ListingFuelType;
  transmission: ListingTransmission;
  mileage: number;
  rimSizeInches: number;
  color: string;
  isNegotiable: ListingYesNo;
  accidentHistory: ListingYesNo;
  description: string;
  postedAt: string;
  galleryImageUrls: string[];
};

export type ListingEditorOptions = {
  bodyTypes: ListingBodyType[];
  conditions: ListingCondition[];
  fuelTypes: ListingFuelType[];
  transmissions: ListingTransmission[];
  sellerTypes: ListingSellerType[];
  yesNoOptions: ListingYesNo[];
  referenceCatalog: ReturnType<typeof getCatalogReferenceCatalog>;
};

export const listingBodyTypes: ListingBodyType[] = [
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

export const listingConditions: ListingCondition[] = ["NEW", "USED"];
export const listingFuelTypes: ListingFuelType[] = [
  "PETROL",
  "DIESEL",
  "HYBRID",
  "PLUG_IN_HYBRID",
  "ELECTRIC",
  "REEV",
  "GAS",
];
export const listingTransmissions: ListingTransmission[] = ["MANUAL", "AUTOMATIC"];
export const listingSellerTypes: ListingSellerType[] = ["OWNER", "DEALER"];
export const listingYesNoOptions: ListingYesNo[] = ["YES", "NO"];

export const isListingStatus = (value: string): value is ListingStatus =>
  value === "PENDING" || value === "APPROVED" || value === "REJECTED";

export const isListingBodyType = (value: string): value is ListingBodyType =>
  listingBodyTypes.includes(value as ListingBodyType);

export const isListingCondition = (value: string): value is ListingCondition =>
  listingConditions.includes(value as ListingCondition);

export const isListingFuelType = (value: string): value is ListingFuelType =>
  listingFuelTypes.includes(value as ListingFuelType);

export const isListingTransmission = (value: string): value is ListingTransmission =>
  listingTransmissions.includes(value as ListingTransmission);

export const isListingSellerType = (value: string): value is ListingSellerType =>
  listingSellerTypes.includes(value as ListingSellerType);

export const isListingYesNo = (value: string): value is ListingYesNo =>
  listingYesNoOptions.includes(value as ListingYesNo);

export const getListingEditorOptions = (): ListingEditorOptions => ({
  bodyTypes: listingBodyTypes,
  conditions: listingConditions,
  fuelTypes: listingFuelTypes,
  transmissions: listingTransmissions,
  sellerTypes: listingSellerTypes,
  yesNoOptions: listingYesNoOptions,
  referenceCatalog: getCatalogReferenceCatalog(),
});
