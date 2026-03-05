import { getReadOnlySqliteDb, getWritableSqliteDb, parseStoredGalleryImageUrls } from "../../data/sqliteDb";
import { getDeletableCatalogImagePaths } from "../catalog-assets/service";
import { buildSellerIdBase, normalizeEgyptianPhone } from "../shared/phone";
import {
  getListingEditorOptions,
  isListingBodyType,
  isListingCondition,
  isListingFuelType,
  isListingSellerType,
  isListingStatus,
  isListingTransmission,
  isListingYesNo,
  type FeaturedRequestStatus,
  type ListingBodyType,
  type ListingCondition,
  type ListingEditorOptions,
  type ListingFormInput,
  type ListingFuelType,
  type ListingSellerType,
  type ListingStatus,
  type ListingTransmission,
  type ListingYesNo,
} from "../../listings/shared";
export {
  getListingEditorOptions,
  isListingBodyType,
  isListingCondition,
  isListingFuelType,
  isListingSellerType,
  isListingStatus,
  isListingTransmission,
  isListingYesNo,
  type FeaturedRequestStatus,
  type ListingBodyType,
  type ListingCondition,
  type ListingEditorOptions,
  type ListingFormInput,
  type ListingFuelType,
  type ListingSellerType,
  type ListingStatus,
  type ListingTransmission,
  type ListingYesNo,
} from "../../listings/shared";

export type AdminListingsMode = "MODERATION" | "FEATURED";

type ListingStatusCount = {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
  featured: number;
  featureRequestsPending: number;
  featureAll: number;
  featureApproved: number;
  featureRejected: number;
};

export type AdminListingRecord = {
  id: string;
  status: ListingStatus;
  isFeatured: boolean;
  featuredPosition: number | null;
  featuredRequestStatus: FeaturedRequestStatus;
  brand: string;
  model: string;
  sellerName: string;
  telephone: string;
  sellerType: string;
  bodyType: string;
  year: number;
  priceValue: number;
  condition: string;
  fuelType: string;
  transmission: string;
  mileage: number;
  rimSizeInches: number;
  color: string;
  isNegotiable: string;
  accidentHistory: string;
  description: string;
  postedAt: string;
  galleryImageUrls: string[];
};

type ListingRow = {
  id: string;
  status: ListingStatus;
  is_featured: "YES" | "NO";
  featured_position: number | null;
  featured_request_status: FeaturedRequestStatus;
  brand: string;
  model: string;
  seller_name: string;
  telephone: string;
  seller_type: string;
  body_type: string;
  year: number;
  price_value: number;
  condition: string;
  fuel_type: string;
  transmission: string;
  mileage: number;
  rim_size_inches: number;
  color: string;
  is_negotiable: string;
  accident_history: string;
  description: string;
  posted_at: string;
  gallery_image_urls: string;
};

const listingSelect = `
  SELECT
    l.id,
    l.status,
    l.is_featured,
    l.featured_position,
    l.featured_request_status,
    b.name AS brand,
    m.name AS model,
    s.name AS seller_name,
    s.phone AS telephone,
    s.seller_type,
    l.body_type,
    l.year,
    l.price_value,
    l.condition,
    l.fuel_type,
    l.transmission,
    l.mileage,
    l.rim_size_inches,
    l.color,
    l.is_negotiable,
    l.accident_history,
    l.description,
    l.posted_at,
    l.gallery_image_urls
  FROM car_listings l
  INNER JOIN sellers s ON s.id = l.seller_id
  INNER JOIN car_models m ON m.id = l.model_id
  INNER JOIN car_brands b ON b.id = m.brand_id
`;

const normalizedPhoneSql = `
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(LOWER(s.phone), ' ', ''),
          '-', ''
        ),
        '(', ''
      ),
      ')', ''
    ),
    '+', ''
  )
`;

const getPhoneSearchVariants = (value: string): string[] => {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return [];
  }

  const variants = new Set<string>([digits]);

  if (digits.startsWith("0") && digits.length > 1) {
    variants.add(`20${digits.slice(1)}`);
  }

  if (digits.startsWith("20") && digits.length > 2) {
    variants.add(`0${digits.slice(2)}`);
    variants.add(digits.slice(2));
  }

  if (digits.startsWith("1") && digits.length >= 10) {
    variants.add(`20${digits}`);
    variants.add(`0${digits}`);
  }

  return Array.from(variants);
};

const mapListingRow = (row: ListingRow, baseUrl: string): AdminListingRecord => ({
  id: row.id,
  status: row.status,
  isFeatured: row.is_featured === "YES",
  featuredPosition: row.featured_position,
  featuredRequestStatus: row.featured_request_status,
  brand: row.brand,
  model: row.model,
  sellerName: row.seller_name,
  telephone: row.telephone,
  sellerType: row.seller_type,
  bodyType: row.body_type,
  year: row.year,
  priceValue: row.price_value,
  condition: row.condition,
  fuelType: row.fuel_type,
  transmission: row.transmission,
  mileage: row.mileage,
  rimSizeInches: row.rim_size_inches,
  color: row.color,
  isNegotiable: row.is_negotiable,
  accidentHistory: row.accident_history,
  description: row.description,
  postedAt: row.posted_at,
  galleryImageUrls: parseStoredGalleryImageUrls(row.gallery_image_urls, baseUrl),
});

export const getListingStatusCounts = (): ListingStatusCount => {
  const db = getReadOnlySqliteDb();
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM car_listings
    GROUP BY status
  `).all() as Array<{ status: ListingStatus; total: number }>;
  const featuredCount = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE status = 'APPROVED' AND is_featured = 'YES' AND featured_position IS NOT NULL
      `).get() as { total: number }
    ).total,
  );
  const featureRequestsPending = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE status = 'APPROVED' AND featured_request_status = 'PENDING'
      `).get() as { total: number }
    ).total,
  );
  const featureApproved = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE status = 'APPROVED' AND is_featured = 'YES' AND featured_position IS NOT NULL
      `).get() as { total: number }
    ).total,
  );
  const featureRejected = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE status = 'APPROVED' AND featured_request_status = 'REJECTED'
      `).get() as { total: number }
    ).total,
  );

  const counts: ListingStatusCount = {
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
    featured: featuredCount,
    featureRequestsPending,
    featureAll: featureApproved + featureRequestsPending + featureRejected,
    featureApproved,
    featureRejected,
  };

  for (const row of statusRows) {
    counts.all += Number(row.total);
    if (row.status === "PENDING") {
      counts.pending = Number(row.total);
    } else if (row.status === "APPROVED") {
      counts.approved = Number(row.total);
    } else if (row.status === "REJECTED") {
      counts.rejected = Number(row.total);
    }
  }

  return counts;
};

export const getAdminListings = ({
  baseUrl,
  mode,
  filter,
  query,
}: {
  baseUrl: string;
  mode: AdminListingsMode;
  filter?: ListingStatus;
  query?: string;
}): AdminListingRecord[] => {
  const db = getReadOnlySqliteDb();
  const normalizedQuery = query?.trim() ?? "";
  const hasQuery = normalizedQuery.length > 0;
  const phoneVariants = hasQuery ? getPhoneSearchVariants(normalizedQuery) : [];
  const searchParts: string[] = [];
  const searchValues: string[] = [];

  if (hasQuery) {
    searchParts.push("LOWER(s.name) LIKE LOWER(?)");
    searchValues.push(`%${normalizedQuery}%`);

    searchParts.push("LOWER(b.name) LIKE LOWER(?)");
    searchValues.push(`%${normalizedQuery}%`);

    searchParts.push("LOWER(m.name) LIKE LOWER(?)");
    searchValues.push(`%${normalizedQuery}%`);

    for (const variant of phoneVariants) {
      searchParts.push(`${normalizedPhoneSql} LIKE ?`);
      searchValues.push(`%${variant}%`);
    }
  }

  const searchClause =
    searchParts.length > 0
      ? ` AND (${searchParts.join(" OR ")})`
      : "";
  const rows = (
    mode === "FEATURED"
      ? filter === "PENDING"
        ? db.prepare(`
            ${listingSelect}
            WHERE l.status = 'APPROVED' AND l.featured_request_status = 'PENDING'
            ${searchClause}
            ORDER BY l.posted_at DESC, l.id DESC
          `).all(...searchValues)
        : filter === "APPROVED"
          ? db.prepare(`
              ${listingSelect}
              WHERE l.status = 'APPROVED' AND l.is_featured = 'YES' AND l.featured_position IS NOT NULL
              ${searchClause}
              ORDER BY l.featured_position ASC, l.posted_at DESC, l.id DESC
            `).all(...searchValues)
          : filter === "REJECTED"
            ? db.prepare(`
                ${listingSelect}
                WHERE l.status = 'APPROVED' AND l.featured_request_status = 'REJECTED'
                ${searchClause}
                ORDER BY l.posted_at DESC, l.id DESC
              `).all(...searchValues)
            : db.prepare(`
                ${listingSelect}
                WHERE l.status = 'APPROVED' AND (
                  (l.is_featured = 'YES' AND l.featured_position IS NOT NULL) OR
                  l.featured_request_status = 'PENDING' OR
                  l.featured_request_status = 'REJECTED'
                )
                ${searchClause}
                ORDER BY
                  CASE WHEN l.is_featured = 'YES' AND l.featured_position IS NOT NULL THEN 0 ELSE 1 END,
                  CASE WHEN l.featured_position IS NULL THEN 999 ELSE l.featured_position END ASC,
                  CASE WHEN l.featured_request_status = 'PENDING' THEN 0 ELSE 1 END,
                  l.posted_at DESC,
                  l.id DESC
              `).all(...searchValues)
      : filter
        ? db.prepare(`
            ${listingSelect}
            WHERE l.status = ?
            ${searchClause}
            ORDER BY l.posted_at DESC, l.id DESC
          `).all(filter, ...searchValues)
        : db.prepare(`
            ${listingSelect}
            WHERE 1 = 1
            ${searchClause}
            ORDER BY l.posted_at DESC, l.id DESC
          `).all(...searchValues)
  ) as ListingRow[];

  return rows.map((row) => mapListingRow(row, baseUrl));
};

export const getAdminListingById = ({
  listingId,
  baseUrl,
}: {
  listingId: string;
  baseUrl: string;
}): AdminListingRecord | undefined => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    ${listingSelect}
    WHERE l.id = ?
  `).get(listingId) as ListingRow | undefined;

  return row ? mapListingRow(row, baseUrl) : undefined;
};

const findModelId = (brand: string, model: string): string | undefined => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    SELECT m.id
    FROM car_models m
    INNER JOIN car_brands b ON b.id = m.brand_id
    WHERE b.name = ? AND m.name = ?
  `).get(brand, model) as { id: string } | undefined;

  return row?.id;
};

const ensureUniqueSellerId = (baseId: string): string => {
  const db = getWritableSqliteDb();
  let candidate = baseId;
  let suffix = 2;

  while (db.prepare(`SELECT 1 FROM sellers WHERE id = ?`).get(candidate)) {
    candidate = `${baseId}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const upsertSeller = (input: Pick<ListingFormInput, "sellerName" | "telephone" | "sellerType">): string => {
  const db = getWritableSqliteDb();
  const normalizedTelephone = normalizeEgyptianPhone(input.telephone);
  const existing = db.prepare(`
    SELECT id
    FROM sellers
    WHERE phone = ?
  `).get(normalizedTelephone) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE sellers
      SET name = ?, phone = ?, seller_type = ?
      WHERE id = ?
    `).run(input.sellerName, normalizedTelephone, input.sellerType, existing.id);
    return existing.id;
  }

  const sellerId = ensureUniqueSellerId(buildSellerIdBase(input.sellerName, normalizedTelephone));
  db.prepare(`
    INSERT INTO sellers (id, name, phone, seller_type)
    VALUES (?, ?, ?, ?)
  `).run(sellerId, input.sellerName, normalizedTelephone, input.sellerType);
  return sellerId;
};

export const updateAdminListing = (
  listingId: string,
  input: ListingFormInput,
): "UPDATED" | "NOT_FOUND" | "INVALID_MODEL" => {
  const db = getWritableSqliteDb();
  const current = db.prepare(`
    SELECT id
    FROM car_listings
    WHERE id = ?
  `).get(listingId) as { id: string } | undefined;

  if (!current) {
    return "NOT_FOUND";
  }

  const modelId = findModelId(input.brand, input.model);
  if (!modelId) {
    return "INVALID_MODEL";
  }

  const sellerId = upsertSeller(input);

  db.prepare(`
    UPDATE car_listings
    SET
      seller_id = ?,
      model_id = ?,
      body_type = ?,
      year = ?,
      price_value = ?,
      condition = ?,
      fuel_type = ?,
      transmission = ?,
      mileage = ?,
      rim_size_inches = ?,
      color = ?,
      is_negotiable = ?,
      accident_history = ?,
      description = ?,
      posted_at = ?,
      gallery_image_urls = ?
    WHERE id = ?
  `).run(
    sellerId,
    modelId,
    input.bodyType,
    input.year,
    input.priceValue,
    input.condition,
    input.fuelType,
    input.transmission,
    input.mileage,
    input.rimSizeInches,
    input.color,
    input.isNegotiable,
    input.accidentHistory,
    input.description,
    input.postedAt,
    JSON.stringify(input.galleryImageUrls),
    listingId,
  );

  return "UPDATED";
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const createAdminListing = (
  input: ListingFormInput,
): "CREATED" | "INVALID_MODEL" => {
  const db = getWritableSqliteDb();
  const modelId = findModelId(input.brand, input.model);

  if (!modelId) {
    return "INVALID_MODEL";
  }

  const sellerId = upsertSeller(input);
  const listingId = `listing_${slugify(input.model)}_${Date.now().toString(36)}`;

  db.prepare(`
    INSERT INTO car_listings (
      id,
      seller_id,
      model_id,
      status,
      is_featured,
      featured_position,
      featured_request_status,
      body_type,
      year,
      price_value,
      condition,
      fuel_type,
      transmission,
      mileage,
      rim_size_inches,
      color,
      is_negotiable,
      accident_history,
      description,
      posted_at,
      gallery_image_urls
    ) VALUES (?, ?, ?, 'APPROVED', 'NO', NULL, 'NONE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    listingId,
    sellerId,
    modelId,
    input.bodyType,
    input.year,
    input.priceValue,
    input.condition,
    input.fuelType,
    input.transmission,
    input.mileage,
    input.rimSizeInches,
    input.color,
    input.isNegotiable,
    input.accidentHistory,
    input.description,
    input.postedAt,
    JSON.stringify(input.galleryImageUrls),
  );

  return "CREATED";
};

export const getStoredAdminListingImagePaths = (
  listingId: string,
): string[] => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    SELECT gallery_image_urls
    FROM car_listings
    WHERE id = ?
  `).get(listingId) as { gallery_image_urls: string } | undefined;

  if (!row) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.gallery_image_urls) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

export const deleteAdminListing = (listingId: string): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    DELETE FROM car_listings
    WHERE id = ?
  `).run(listingId);

  return Number(result.changes) > 0;
};

export { getDeletableCatalogImagePaths };

export const updateListingStatus = (
  listingId: string,
  nextStatus: ListingStatus,
): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    UPDATE car_listings
    SET
      status = ?,
      is_featured = CASE
        WHEN ? = 'APPROVED' THEN is_featured
        ELSE 'NO'
      END,
      featured_position = CASE
        WHEN ? = 'APPROVED' THEN featured_position
        ELSE NULL
      END,
      featured_request_status = CASE
        WHEN ? = 'APPROVED' THEN featured_request_status
        ELSE 'NONE'
      END
    WHERE id = ?
  `).run(nextStatus, nextStatus, nextStatus, nextStatus, listingId);

  return Number(result.changes) > 0;
};

export const getFeaturedListingCount = (): number => {
  const db = getReadOnlySqliteDb();
  return Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE status = 'APPROVED' AND is_featured = 'YES' AND featured_position IS NOT NULL
      `).get() as { total: number }
    ).total,
  );
};

export const updateListingFeaturedState = (
  listingId: string,
  featuredPosition: number | null,
): boolean => {
  const db = getWritableSqliteDb();
  const current = db.prepare(`
    SELECT id
    FROM car_listings
    WHERE id = ? AND status = 'APPROVED'
  `).get(listingId) as { id: string } | undefined;

  if (!current) {
    return false;
  }

  db.exec("BEGIN");

  try {
    if (featuredPosition !== null) {
      db.prepare(`
        UPDATE car_listings
        SET
          is_featured = 'NO',
          featured_position = NULL
        WHERE status = 'APPROVED' AND featured_position = ? AND id != ?
      `).run(featuredPosition, listingId);
    }

    const result = db.prepare(`
      UPDATE car_listings
      SET
        is_featured = ?,
        featured_position = ?,
        featured_request_status = CASE
          WHEN ? IS NOT NULL AND featured_request_status = 'PENDING' THEN 'APPROVED'
          WHEN ? IS NULL THEN 'NONE'
          ELSE featured_request_status
        END
      WHERE id = ? AND status = 'APPROVED'
    `).run(
      featuredPosition !== null ? "YES" : "NO",
      featuredPosition,
      featuredPosition,
      featuredPosition,
      listingId,
    );

    db.exec("COMMIT");
    return Number(result.changes) > 0;
  } catch {
    db.exec("ROLLBACK");
    throw new Error("Failed to update featured position.");
  }
};

export const updateListingFeaturedRequestStatus = (
  listingId: string,
  nextStatus: Exclude<FeaturedRequestStatus, "NONE">,
): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    UPDATE car_listings
    SET
      featured_request_status = ?,
      is_featured = CASE
        WHEN ? = 'APPROVED' THEN 'YES'
        ELSE 'NO'
      END,
      featured_position = CASE
        WHEN ? = 'APPROVED' THEN featured_position
        ELSE NULL
      END
    WHERE id = ? AND status = 'APPROVED'
  `).run(nextStatus, nextStatus, nextStatus, listingId);

  return Number(result.changes) > 0;
};
