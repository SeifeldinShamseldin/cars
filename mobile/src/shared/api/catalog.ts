import { fetchJson } from "./http";

export type CatalogCategory = "SELL" | "UPDATE";

export type CarType =
  | "SEDAN"
  | "COUPE"
  | "SUV"
  | "HATCHBACK"
  | "CONVERTIBLE"
  | "CABRIOLET"
  | "CROSSOVER"
  | "WAGON"
  | "ESTATE"
  | "PICKUP"
  | "VAN"
  | "MINIVAN"
  | "ROADSTER";

export type Condition = "NEW" | "USED";

export type FuelType =
  | "PETROL"
  | "DIESEL"
  | "HYBRID"
  | "PLUG_IN_HYBRID"
  | "ELECTRIC"
  | "REEV"
  | "GAS";

export type Transmission = "MANUAL" | "AUTOMATIC";

export type SellerType = "OWNER" | "DEALER";
export type YesNo = "YES" | "NO";

export type SellCarSummary = {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  priceValue: number;
  condition: Condition;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  rimSizeInches: number;
  sellerType: SellerType;
  sellerName: string;
  telephone: string;
  postedAt: string;
  color: string;
  isNegotiable: YesNo;
  accidentHistory: YesNo;
};

export type CarUpdateSummary = {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  postedAt: string;
};

export type CarSummary = SellCarSummary | CarUpdateSummary;

export type CarDetail = CarSummary;

export const isSellCar = (car: CarSummary | CarDetail): car is SellCarSummary =>
  "priceValue" in car;

export type PaginatedCarsResponse<TCar extends CarSummary = CarSummary> = {
  cars: TCar[];
  total: number;
  nextOffset: number | null;
};

export type HomeCatalogResponse = {
  featuredCars: CarUpdateSummary[];
  sellCars: SellCarSummary[];
  sellFeed: PaginatedCarsResponse<SellCarSummary>;
  updateFeed: PaginatedCarsResponse<CarUpdateSummary>;
};

export type CarReferenceModelGroup = {
  groupLabel: string | null;
  models: string[];
};

export type CarReferenceCatalog = {
  brands: string[];
  modelGroupsByBrand: Record<string, CarReferenceModelGroup[]>;
};

export type SellCarsSearchParams = {
  query?: string;
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

export const fetchHomeCatalog = async (): Promise<HomeCatalogResponse> =>
  fetchJson<HomeCatalogResponse>("/api/home");

export const fetchCarReferenceCatalog = async (): Promise<CarReferenceCatalog> =>
  fetchJson<CarReferenceCatalog>("/api/reference/cars");

export const fetchCarsPage = async (
  category: CatalogCategory,
  offset = 0,
  limit = 20,
): Promise<PaginatedCarsResponse> => {
  const endpoint = category === "SELL" ? "/api/sell-cars" : "/api/new-cars";

  return fetchJson<PaginatedCarsResponse>(
    `${endpoint}?offset=${offset}&limit=${limit}`,
  );
};

export const fetchSellCarsSearch = async (
  params: SellCarsSearchParams,
  offset = 0,
  limit = 20,
): Promise<PaginatedCarsResponse<SellCarSummary>> => {
  const query = new URLSearchParams();
  query.set("offset", String(offset));
  query.set("limit", String(limit));

  if (params.query?.trim()) {
    query.set("q", params.query.trim());
  }
  if (params.brand?.trim()) {
    query.set("brand", params.brand.trim());
  }
  for (const model of params.model ?? []) {
    if (model.trim()) {
      query.append("model", model.trim());
    }
  }
  if (params.carType?.trim()) {
    query.set("carType", params.carType.trim());
  }
  if (params.priceFrom !== undefined) {
    query.set("priceFrom", String(params.priceFrom));
  }
  if (params.priceTo !== undefined) {
    query.set("priceTo", String(params.priceTo));
  }
  if (params.yearFrom !== undefined) {
    query.set("yearFrom", String(params.yearFrom));
  }
  if (params.yearTo !== undefined) {
    query.set("yearTo", String(params.yearTo));
  }
  if (params.condition?.trim()) {
    query.set("condition", params.condition.trim());
  }
  if (params.transmission?.trim()) {
    query.set("transmission", params.transmission.trim());
  }
  if (params.fuelType?.trim()) {
    query.set("fuelType", params.fuelType.trim());
  }
  if (params.mileageFrom !== undefined) {
    query.set("mileageFrom", String(params.mileageFrom));
  }
  if (params.mileageTo !== undefined) {
    query.set("mileageTo", String(params.mileageTo));
  }

  return fetchJson<PaginatedCarsResponse<SellCarSummary>>(
    `/api/sell-cars/search?${query.toString()}`,
  );
};
