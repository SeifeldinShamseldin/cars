import type { SellCarSummaryDto } from "../data/demoCars";
import {
  searchSellCatalogCars,
  type SellCatalogSearchParams,
} from "../data/catalogSqlite";

export type SellCarsSearchParams = SellCatalogSearchParams;

export type SellCarsSearchResult = {
  cars: SellCarSummaryDto[];
  total: number;
  nextOffset: number | null;
};

export const searchSellCars = ({
  baseUrl,
  params,
  offset,
  limit,
}: {
  baseUrl: string;
  params: SellCarsSearchParams;
  offset: number;
  limit: number;
}): SellCarsSearchResult =>
  searchSellCatalogCars({
    baseUrl,
    params,
    offset,
    limit,
  });
