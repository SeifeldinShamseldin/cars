import type {
  CarCategory,
  CatalogCarSummaryDto,
  SellCarSummaryDto,
  UpdateCarSummaryDto,
} from "./demoCars";
import {
  getReadOnlySqliteDb,
  parseStoredGalleryImageUrls,
} from "./sqliteDb";

export type CarReferenceModelGroupDto = {
  groupLabel: string | null;
  models: string[];
};

export type CarReferenceCatalogDto = {
  brands: string[];
  modelGroupsByBrand: Record<string, CarReferenceModelGroupDto[]>;
};

type SellListingRow = {
  id: string;
  brand: string;
  model: string;
  type: SellCarSummaryDto["type"];
  year: number;
  description: string;
  gallery_image_urls: string;
  price_value: number;
  condition: SellCarSummaryDto["condition"];
  fuel_type: SellCarSummaryDto["fuelType"];
  transmission: SellCarSummaryDto["transmission"];
  mileage: number;
  rim_size_inches: number;
  seller_type: SellCarSummaryDto["sellerType"];
  seller_name: string;
  telephone: string;
  posted_at: string;
  color: string;
  is_negotiable: SellCarSummaryDto["isNegotiable"];
  accident_history: SellCarSummaryDto["accidentHistory"];
};

export type SellCatalogSearchParams = {
  q?: string;
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

const featuredSellStatement = `
  SELECT
    l.id,
    b.name AS brand,
    m.name AS model,
    l.body_type AS type,
    l.year,
    l.description,
    l.gallery_image_urls,
    l.price_value,
    l.condition,
    l.fuel_type,
    l.transmission,
    l.mileage,
    l.rim_size_inches,
    s.seller_type,
    s.name AS seller_name,
    s.phone AS telephone,
    l.posted_at,
    l.color,
    l.is_negotiable,
    l.accident_history
  FROM car_listings l
  INNER JOIN sellers s ON s.id = l.seller_id
  INNER JOIN car_models m ON m.id = l.model_id
  INNER JOIN car_brands b ON b.id = m.brand_id
  WHERE l.status = 'APPROVED' AND l.is_featured = 'YES' AND l.featured_position IS NOT NULL
  ORDER BY l.featured_position ASC, l.posted_at DESC, l.id DESC
  LIMIT 5
`;

type UpdateRow = {
  id: string;
  is_featured?: "YES" | "NO";
  featured_position?: number | null;
  featured_request_status?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  brand: string;
  model: string;
  type: UpdateCarSummaryDto["type"];
  year: number;
  description: string;
  gallery_image_urls: string;
  posted_at: string;
};

const featuredUpdateStatement = `
  SELECT
    id,
    brand,
    model,
    body_type AS type,
    year,
    description,
    gallery_image_urls,
    posted_at
  FROM car_updates
  WHERE status = 'VISIBLE' AND is_featured = 'YES' AND featured_position IS NOT NULL
  ORDER BY featured_position ASC, posted_at DESC, id DESC
  LIMIT 5
`;

type ReferenceRow = {
  brand_name: string;
  group_label: string | null;
  model_name: string;
};

const adminTables = [
  "car_brands",
  "car_models",
  "sellers",
  "car_listings",
  "car_updates",
] as const;

export type CatalogAdminTableName = (typeof adminTables)[number];

type CatalogAdminSnapshot = {
  tables: Array<{
    name: CatalogAdminTableName;
    count: number;
  }>;
};

type CatalogAdminTableData = {
  table: CatalogAdminTableName;
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

const listSellStatement = `
  SELECT
    l.id,
    b.name AS brand,
    m.name AS model,
    l.body_type AS type,
    l.year,
    l.description,
    l.gallery_image_urls,
    l.price_value,
    l.condition,
    l.fuel_type,
    l.transmission,
    l.mileage,
    l.rim_size_inches,
    s.seller_type,
    s.name AS seller_name,
    s.phone AS telephone,
    l.posted_at,
    l.color,
    l.is_negotiable,
    l.accident_history
  FROM car_listings l
  INNER JOIN sellers s ON s.id = l.seller_id
  INNER JOIN car_models m ON m.id = l.model_id
  INNER JOIN car_brands b ON b.id = m.brand_id
  WHERE l.status = 'APPROVED'
  ORDER BY l.posted_at DESC, l.id DESC
  LIMIT ? OFFSET ?
`;

const countSellStatement = "SELECT COUNT(*) AS total FROM car_listings WHERE status = 'APPROVED'";

const listUpdateStatement = `
  SELECT
    id,
    brand,
    model,
    body_type AS type,
    year,
    description,
    gallery_image_urls,
    posted_at
  FROM car_updates
  WHERE status = 'VISIBLE'
  ORDER BY posted_at DESC, id DESC
  LIMIT ? OFFSET ?
`;

const countUpdateStatement = "SELECT COUNT(*) AS total FROM car_updates WHERE status = 'VISIBLE'";

const referenceStatement = `
  SELECT
    b.name AS brand_name,
    m.group_label,
    m.name AS model_name
  FROM car_models m
  INNER JOIN car_brands b ON b.id = m.brand_id
  ORDER BY b.name ASC, m.group_label ASC, m.name ASC
`;

const mapSellRow = (row: SellListingRow, baseUrl: string): SellCarSummaryDto => ({
  id: row.id,
  brand: row.brand,
  model: row.model,
  type: row.type,
  year: row.year,
  galleryImageUrls: parseStoredGalleryImageUrls(row.gallery_image_urls, baseUrl),
  description: row.description,
  priceValue: row.price_value,
  condition: row.condition,
  fuelType: row.fuel_type,
  transmission: row.transmission,
  mileage: row.mileage,
  rimSizeInches: row.rim_size_inches,
  sellerType: row.seller_type,
  sellerName: row.seller_name,
  telephone: row.telephone,
  postedAt: row.posted_at,
  color: row.color,
  isNegotiable: row.is_negotiable,
  accidentHistory: row.accident_history,
});

const mapUpdateRow = (row: UpdateRow, baseUrl: string): UpdateCarSummaryDto => ({
  id: row.id,
  brand: row.brand,
  model: row.model,
  type: row.type,
  year: row.year,
  galleryImageUrls: parseStoredGalleryImageUrls(row.gallery_image_urls, baseUrl),
  description: row.description,
  postedAt: row.posted_at,
});

const normalizeFilterValue = (value: string): string =>
  value.trim().toLowerCase().replace(/[_-]+/g, " ");

const resolveCarTypeFilters = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  const normalized = normalizeFilterValue(value);
  const aliasMap: Record<string, string[]> = {
    sedan: ["SEDAN"],
    coupe: ["COUPE"],
    convertible: ["CONVERTIBLE", "CABRIOLET"],
    cabriolet: ["CABRIOLET", "CONVERTIBLE"],
    hatchback: ["HATCHBACK"],
    suv: ["SUV"],
    crossover: ["CROSSOVER"],
    wagon: ["WAGON", "ESTATE"],
    estate: ["ESTATE", "WAGON"],
    pickup: ["PICKUP"],
    van: ["VAN", "MINIVAN"],
    minivan: ["MINIVAN", "VAN"],
    roadster: ["ROADSTER"],
  };

  return aliasMap[normalized] ?? [];
};

const resolveExactEnumFilter = (
  value: string | undefined,
  allowed: string[],
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeFilterValue(value);
  const matched = allowed.find(
    (entry) => normalizeFilterValue(entry) === normalized,
  );
  return matched;
};

const resolveFuelTypeFilter = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  const normalized = normalizeFilterValue(value);
  const aliasMap: Record<string, string[]> = {
    reev: ["REEV"],
    electric: ["ELECTRIC"],
    hybrid: ["HYBRID"],
    "plug in hybrid": ["PLUG_IN_HYBRID"],
    "plug-in hybrid": ["PLUG_IN_HYBRID"],
    petrol: ["PETROL"],
    gasoline: ["PETROL"],
    diesel: ["DIESEL"],
    gas: ["GAS"],
  };

  return aliasMap[normalized] ?? [];
};

const buildSellSearchWhere = (
  params: SellCatalogSearchParams,
): { whereSql: string; values: Array<string | number> } => {
  const clauses: string[] = ["l.status = 'APPROVED'"];
  const values: Array<string | number> = [];

  const rawQuery = params.q?.trim();
  if (rawQuery) {
    const tokens = rawQuery
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 6);

    for (const token of tokens) {
      const like = `%${token}%`;
      clauses.push(`(
        LOWER(b.name) LIKE ?
        OR LOWER(m.name) LIKE ?
        OR LOWER(l.description) LIKE ?
        OR LOWER(s.name) LIKE ?
        OR LOWER(l.color) LIKE ?
        OR CAST(l.year AS TEXT) LIKE ?
      )`);
      values.push(like, like, like, like, like, like);
    }
  }

  const brand = params.brand?.trim();
  if (brand) {
    clauses.push("b.name = ?");
    values.push(brand);
  }

  const models = (params.model ?? []).map((value) => value.trim()).filter(Boolean);
  if (models.length > 0) {
    clauses.push(`m.name IN (${models.map(() => "?").join(", ")})`);
    values.push(...models);
  }

  const carTypes = resolveCarTypeFilters(params.carType);
  if (carTypes.length > 0) {
    clauses.push(`l.body_type IN (${carTypes.map(() => "?").join(", ")})`);
    values.push(...carTypes);
  }

  if (params.priceFrom !== undefined) {
    clauses.push("l.price_value >= ?");
    values.push(params.priceFrom);
  }

  if (params.priceTo !== undefined) {
    clauses.push("l.price_value <= ?");
    values.push(params.priceTo);
  }

  if (params.yearFrom !== undefined) {
    clauses.push("l.year >= ?");
    values.push(params.yearFrom);
  }

  if (params.yearTo !== undefined) {
    clauses.push("l.year <= ?");
    values.push(params.yearTo);
  }

  const condition = resolveExactEnumFilter(params.condition, ["NEW", "USED"]);
  if (condition) {
    clauses.push("l.condition = ?");
    values.push(condition);
  }

  const transmission = resolveExactEnumFilter(params.transmission, ["MANUAL", "AUTOMATIC"]);
  if (transmission) {
    clauses.push("l.transmission = ?");
    values.push(transmission);
  }

  const fuelTypes = resolveFuelTypeFilter(params.fuelType);
  if (fuelTypes.length > 0) {
    clauses.push(`l.fuel_type IN (${fuelTypes.map(() => "?").join(", ")})`);
    values.push(...fuelTypes);
  }

  if (params.mileageFrom !== undefined) {
    clauses.push("l.mileage >= ?");
    values.push(params.mileageFrom);
  }

  if (params.mileageTo !== undefined) {
    clauses.push("l.mileage <= ?");
    values.push(params.mileageTo);
  }

  return {
    whereSql: clauses.join(" AND "),
    values,
  };
};

const getPage = (
  category: CarCategory,
  baseUrl: string,
  offset: number,
  limit: number,
): {
  cars: CatalogCarSummaryDto[];
  total: number;
  nextOffset: number | null;
} => {
  const db = getReadOnlySqliteDb();

  if (category === "SELL") {
    const total = Number(
      (db.prepare(countSellStatement).get() as { total: number }).total,
    );
    const rows = db
      .prepare(listSellStatement)
      .all(limit, offset) as SellListingRow[];
    const cars = rows.map((row) => mapSellRow(row, baseUrl));

    return {
      cars,
      total,
      nextOffset: offset + limit < total ? offset + limit : null,
    };
  }

  const total = Number(
    (db.prepare(countUpdateStatement).get() as { total: number }).total,
  );
  const rows = db
    .prepare(listUpdateStatement)
    .all(limit, offset) as UpdateRow[];
  const cars = rows.map((row) => mapUpdateRow(row, baseUrl));

  return {
    cars,
    total,
    nextOffset: offset + limit < total ? offset + limit : null,
  };
};

export const getCatalogCarsByCategory = (
  category: CarCategory,
  baseUrl: string,
  offset = 0,
  limit = 20,
): {
  cars: CatalogCarSummaryDto[];
  total: number;
  nextOffset: number | null;
} => getPage(category, baseUrl, offset, limit);

export const searchSellCatalogCars = ({
  baseUrl,
  params,
  offset,
  limit,
}: {
  baseUrl: string;
  params: SellCatalogSearchParams;
  offset: number;
  limit: number;
}): {
  cars: SellCarSummaryDto[];
  total: number;
  nextOffset: number | null;
} => {
  const db = getReadOnlySqliteDb();
  const { whereSql, values } = buildSellSearchWhere(params);
  const fromClause = `
    FROM car_listings l
    INNER JOIN sellers s ON s.id = l.seller_id
    INNER JOIN car_models m ON m.id = l.model_id
    INNER JOIN car_brands b ON b.id = m.brand_id
    WHERE ${whereSql}
  `;
  const total = Number(
    (
      db
        .prepare(`SELECT COUNT(*) AS total ${fromClause}`)
        .get(...values) as { total: number }
    ).total,
  );
  const rows = db
    .prepare(`
      SELECT
        l.id,
        b.name AS brand,
        m.name AS model,
        l.body_type AS type,
        l.year,
        l.description,
        l.gallery_image_urls,
        l.price_value,
        l.condition,
        l.fuel_type,
        l.transmission,
        l.mileage,
        l.rim_size_inches,
        s.seller_type,
        s.name AS seller_name,
        s.phone AS telephone,
        l.posted_at,
        l.color,
        l.is_negotiable,
        l.accident_history
      ${fromClause}
      ORDER BY l.posted_at DESC, l.id DESC
      LIMIT ? OFFSET ?
    `)
    .all(...values, limit, offset) as SellListingRow[];

  return {
    cars: rows.map((row) => mapSellRow(row, baseUrl)),
    total,
    nextOffset: offset + limit < total ? offset + limit : null,
  };
};

export const getCatalogHomePayload = (baseUrl: string) => {
  const db = getReadOnlySqliteDb();
  const sellFeed = getPage("SELL", baseUrl, 0, 20);
  const updateFeed = getPage("UPDATE", baseUrl, 0, 20);
  const featuredSellRows = db.prepare(featuredSellStatement).all() as SellListingRow[];
  const featuredUpdateRows = db.prepare(featuredUpdateStatement).all() as UpdateRow[];
  const featuredSellCars = featuredSellRows.map((row) => mapSellRow(row, baseUrl));
  const featuredUpdateCars = featuredUpdateRows.map((row) => mapUpdateRow(row, baseUrl));

  return {
    featuredCars: featuredUpdateCars,
    sellCars: featuredSellCars,
    sellFeed: sellFeed as {
      cars: SellCarSummaryDto[];
      total: number;
      nextOffset: number | null;
    },
    updateFeed: updateFeed as {
      cars: UpdateCarSummaryDto[];
      total: number;
      nextOffset: number | null;
    },
  };
};

export const getCatalogReferenceCatalog = (): CarReferenceCatalogDto => {
  const db = getReadOnlySqliteDb();
  const rows = db.prepare(referenceStatement).all() as ReferenceRow[];
  const brands = [...new Set(rows.map((row) => row.brand_name))];
  const groupedByBrand = new Map<string, Map<string, Set<string>>>();

  for (const row of rows) {
    const brandKey = row.brand_name.toLowerCase();
    const brandGroups = groupedByBrand.get(brandKey) ?? new Map<string, Set<string>>();
    const groupKey = row.group_label ?? "";
    const models = brandGroups.get(groupKey) ?? new Set<string>();
    models.add(row.model_name);
    brandGroups.set(groupKey, models);
    groupedByBrand.set(brandKey, brandGroups);
  }

  const modelGroupsByBrand: Record<string, CarReferenceModelGroupDto[]> = {};

  for (const [brandKey, groups] of groupedByBrand.entries()) {
    modelGroupsByBrand[brandKey] = [...groups.entries()]
      .map(([groupKey, models]) => ({
        groupLabel: groupKey.length > 0 ? groupKey : null,
        models: [...models].sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => {
        if (left.groupLabel === null) {
          return 1;
        }

        if (right.groupLabel === null) {
          return -1;
        }

        return left.groupLabel.localeCompare(right.groupLabel);
      });
  }

  return {
    brands,
    modelGroupsByBrand,
  };
};

export const getCatalogAdminSnapshot = (): CatalogAdminSnapshot => {
  const db = getReadOnlySqliteDb();

  return {
    tables: adminTables.map((name) => ({
      name,
      count: Number(
        (
          db
            .prepare(`SELECT COUNT(*) AS total FROM ${name}`)
            .get() as { total: number }
        ).total,
      ),
    })),
  };
};

export const isCatalogAdminTableName = (
  value: string,
): value is CatalogAdminTableName =>
  adminTables.includes(value as CatalogAdminTableName);

export const getCatalogAdminTableData = (
  table: CatalogAdminTableName,
  limit = 100,
): CatalogAdminTableData => {
  const db = getReadOnlySqliteDb();
  const columns = (
    db
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{ name: string }>
  ).map((column) => column.name);

  const rows = db
    .prepare(`SELECT * FROM ${table} LIMIT ?`)
    .all(limit) as Array<Record<string, unknown>>;

  return {
    table,
    columns,
    rows,
  };
};
