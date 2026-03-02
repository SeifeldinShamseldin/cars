export type CatalogCategory = "SELL" | "UPDATE";

export type CarSummary = {
  id: string;
  category: CatalogCategory;
  brand: string;
  model: string;
  type: string;
  year: number;
  topSpeedKmh: number;
  torqueNm: number;
  imageUrl: string;
  description: string;
  priceValue?: number;
  priceLabel?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  trim?: string;
  color?: string;
  mileage?: number;
};

export type CarDetail = CarSummary & {
  galleryImageUrls: string[];
  condition?: string;
  fuelType?: string;
  transmission?: string;
  trim?: string;
  color?: string;
  mileage?: number;
  hp?: number;
  engineLabel?: string;
};

export type HomeCatalogResponse = {
  sellCars: CarSummary[];
  newCars: CarSummary[];
};

export type CarReferenceModelGroup = {
  groupLabel: string | null;
  models: string[];
};

export type PaginatedCarsResponse = {
  cars: CarSummary[];
  total: number;
  nextOffset: number | null;
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
const API_BASE_URL = SOCKET_URL.replace(/\/+$/, "");

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Failed request ${path} (${response.status})`);
  }

  return (await response.json()) as T;
};

export const fetchHomeCatalog = async (): Promise<HomeCatalogResponse> => {
  const [sellResponse, newResponse] = await Promise.all([
    fetchJson<{ cars: CarSummary[] }>("/api/home/sell-cars"),
    fetchJson<{ cars: CarSummary[] }>("/api/home/new-cars"),
  ]);

  return {
    sellCars: sellResponse.cars,
    newCars: newResponse.cars,
  };
};

export const fetchCarBrands = async (): Promise<string[]> => {
  const response = await fetchJson<{ brands: string[] }>("/api/reference/car-brands");
  return response.brands;
};

export const fetchCarModelGroups = async (
  brand: string,
): Promise<CarReferenceModelGroup[]> => {
  const response = await fetchJson<{ groups: CarReferenceModelGroup[] }>(
    `/api/reference/car-models?brand=${encodeURIComponent(brand)}`,
  );

  return response.groups;
};

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

export const fetchCarDetail = async (carId: string): Promise<CarDetail> => {
  const response = await fetchJson<{ car: CarDetail }>(
    `/api/cars/${encodeURIComponent(carId)}`,
  );

  return response.car;
};
