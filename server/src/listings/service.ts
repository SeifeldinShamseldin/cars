import { getSellerProfileByAccessToken } from "../admin/access/service";
import {
  getReadOnlySqliteDb,
  getWritableSqliteDb,
  parseStoredGalleryImageUrls,
} from "../data/sqliteDb";
import type {
  FeaturedRequestStatus,
  ListingBodyType,
  ListingCondition,
  ListingFuelType,
  ListingSellerType,
  ListingStatus,
  ListingTransmission,
  ListingYesNo,
} from "./shared";

export type SellerListingCreateInput = {
  brand: string;
  model: string;
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
  galleryImageUrls: string[];
};

export type SellerListingUpdateInput = SellerListingCreateInput;

export type SellerOwnedListingStatus = "SHOWN" | "HIDDEN" | "PENDING";

export type SellerOwnedListingRecord = {
  id: string;
  brand: string;
  model: string;
  type: ListingBodyType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  priceValue: number;
  condition: ListingCondition;
  fuelType: ListingFuelType;
  transmission: ListingTransmission;
  mileage: number;
  rimSizeInches: number;
  postedAt: string;
  color: string;
  status: SellerOwnedListingStatus;
  featuredRequestStatus: FeaturedRequestStatus;
  isFeatured: boolean;
  featuredPosition: number | null;
};

type CreateListingResult =
  | { ok: true; listingId: string; status: "APPROVED" }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID_MODEL" };

type SellerListingsResult =
  | {
      ok: true;
      cars: SellerOwnedListingRecord[];
      total: number;
      nextOffset: number | null;
    }
  | { ok: false; code: "UNAUTHORIZED" };

type SellerListingUpdateResult =
  | { ok: true; listingId: string }
  | { ok: false; code: "UNAUTHORIZED" | "LISTING_NOT_FOUND" | "INVALID_MODEL" };

type SellerListingDeleteResult =
  | { ok: true; listingId: string }
  | { ok: false; code: "UNAUTHORIZED" | "LISTING_NOT_FOUND" };

type RequestFeatureResult =
  | { ok: true; status: "PENDING" }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "LISTING_NOT_FOUND"
        | "LISTING_NOT_APPROVED"
        | "ALREADY_FEATURED"
        | "FEATURE_REQUEST_ALREADY_PENDING";
    };

type SellerListingRow = {
  id: string;
  brand: string;
  model: string;
  type: ListingBodyType;
  year: number;
  description: string;
  gallery_image_urls: string;
  price_value: number;
  condition: ListingCondition;
  fuel_type: ListingFuelType;
  transmission: ListingTransmission;
  mileage: number;
  rim_size_inches: number;
  posted_at: string;
  color: string;
  status: ListingStatus;
  featured_request_status: FeaturedRequestStatus;
  is_featured: "YES" | "NO";
  featured_position: number | null;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const sellerListingSelect = `
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
    l.posted_at,
    l.color,
    l.status,
    l.featured_request_status,
    l.is_featured,
    l.featured_position
  FROM car_listings l
  INNER JOIN car_models m ON m.id = l.model_id
  INNER JOIN car_brands b ON b.id = m.brand_id
`;

const mapSellerOwnedListingStatus = (
  status: ListingStatus,
): SellerOwnedListingStatus =>
  status === "APPROVED" ? "SHOWN" : status === "REJECTED" ? "HIDDEN" : "PENDING";

const mapSellerListingRow = ({
  row,
  baseUrl,
}: {
  row: SellerListingRow;
  baseUrl: string;
}): SellerOwnedListingRecord => ({
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
  postedAt: row.posted_at,
  color: row.color,
  status: mapSellerOwnedListingStatus(row.status),
  featuredRequestStatus: row.featured_request_status,
  isFeatured: row.is_featured === "YES",
  featuredPosition: row.featured_position,
});

const findModelId = (brand: string, model: string): string | undefined => {
  const db = getWritableSqliteDb();
  const row = db.prepare(`
    SELECT m.id
    FROM car_models m
    INNER JOIN car_brands b ON b.id = m.brand_id
    WHERE b.name = ? AND m.name = ?
  `).get(brand, model) as { id: string } | undefined;

  return row?.id;
};

const getSellerOwnedListingMeta = ({
  sellerId,
  listingId,
}: {
  sellerId: string;
  listingId: string;
}): { id: string; posted_at: string } | undefined => {
  const db = getReadOnlySqliteDb();
  return db.prepare(`
    SELECT id, posted_at
    FROM car_listings
    WHERE id = ? AND seller_id = ?
  `).get(listingId, sellerId) as { id: string; posted_at: string } | undefined;
};

const getSellerOwnedListingRow = ({
  sellerId,
  listingId,
  baseUrl,
}: {
  sellerId: string;
  listingId: string;
  baseUrl: string;
}): SellerOwnedListingRecord | undefined => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    ${sellerListingSelect}
    WHERE l.id = ? AND l.seller_id = ?
  `).get(listingId, sellerId) as SellerListingRow | undefined;

  return row ? mapSellerListingRow({ row, baseUrl }) : undefined;
};

export const createSellerListing = ({
  accessToken,
  input,
}: {
  accessToken: string;
  input: SellerListingCreateInput;
}): CreateListingResult => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const modelId = findModelId(input.brand, input.model);
  if (!modelId) {
    return { ok: false, code: "INVALID_MODEL" };
  }

  const db = getWritableSqliteDb();
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
    seller.id,
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
    new Date().toISOString(),
    JSON.stringify(input.galleryImageUrls),
  );

  return {
    ok: true,
    listingId,
    status: "APPROVED",
  };
};

export const getSellerOwnedListings = ({
  accessToken,
  baseUrl,
  offset,
  limit,
}: {
  accessToken: string;
  baseUrl: string;
  offset: number;
  limit: number;
}): SellerListingsResult => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const db = getReadOnlySqliteDb();
  const total = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings
        WHERE seller_id = ?
      `).get(seller.id) as { total: number }
    ).total,
  );
  const rows = db.prepare(`
    ${sellerListingSelect}
    WHERE l.seller_id = ?
    ORDER BY l.posted_at DESC, l.id DESC
    LIMIT ? OFFSET ?
  `).all(seller.id, limit, offset) as SellerListingRow[];

  return {
    ok: true,
    cars: rows.map((row) => mapSellerListingRow({ row, baseUrl })),
    total,
    nextOffset: offset + limit < total ? offset + limit : null,
  };
};

export const getStoredSellerListingImagePaths = ({
  accessToken,
  listingId,
}: {
  accessToken: string;
  listingId: string;
}): string[] => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return [];
  }

  const listing = getSellerOwnedListingRow({
    sellerId: seller.id,
    listingId,
    baseUrl: "",
  });
  return listing?.galleryImageUrls.map((imageUrl) => {
    try {
      const parsed = new URL(imageUrl);
      return parsed.pathname;
    } catch {
      return imageUrl;
    }
  }) ?? [];
};

export const updateSellerOwnedListing = ({
  accessToken,
  listingId,
  input,
}: {
  accessToken: string;
  listingId: string;
  input: SellerListingUpdateInput;
}): SellerListingUpdateResult => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const current = getSellerOwnedListingMeta({
    sellerId: seller.id,
    listingId,
  });
  if (!current) {
    return { ok: false, code: "LISTING_NOT_FOUND" };
  }

  const modelId = findModelId(input.brand, input.model);
  if (!modelId) {
    return { ok: false, code: "INVALID_MODEL" };
  }

  const db = getWritableSqliteDb();
  db.prepare(`
    UPDATE car_listings
    SET
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
      gallery_image_urls = ?
    WHERE id = ? AND seller_id = ?
  `).run(
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
    JSON.stringify(input.galleryImageUrls),
    listingId,
    seller.id,
  );

  return {
    ok: true,
    listingId,
  };
};

export const deleteSellerOwnedListing = ({
  accessToken,
  listingId,
}: {
  accessToken: string;
  listingId: string;
}): SellerListingDeleteResult => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const db = getWritableSqliteDb();
  const result = db.prepare(`
    DELETE FROM car_listings
    WHERE id = ? AND seller_id = ?
  `).run(listingId, seller.id);

  if (Number(result.changes) === 0) {
    return { ok: false, code: "LISTING_NOT_FOUND" };
  }

  return {
    ok: true,
    listingId,
  };
};

export const submitSellerListingFeatureRequest = ({
  accessToken,
  listingId,
}: {
  accessToken: string;
  listingId: string;
}): RequestFeatureResult => {
  const seller = getSellerProfileByAccessToken(accessToken);
  if (!seller) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const db = getWritableSqliteDb();
  const row = db.prepare(`
    SELECT status, is_featured, featured_request_status
    FROM car_listings
    WHERE id = ? AND seller_id = ?
  `).get(listingId, seller.id) as
    | {
        status: ListingStatus;
        is_featured: "YES" | "NO";
        featured_request_status: FeaturedRequestStatus;
      }
    | undefined;

  if (!row) {
    return { ok: false, code: "LISTING_NOT_FOUND" };
  }
  if (row.status !== "APPROVED") {
    return { ok: false, code: "LISTING_NOT_APPROVED" };
  }
  if (row.is_featured === "YES") {
    return { ok: false, code: "ALREADY_FEATURED" };
  }
  if (row.featured_request_status === "PENDING") {
    return { ok: false, code: "FEATURE_REQUEST_ALREADY_PENDING" };
  }

  db.prepare(`
    UPDATE car_listings
    SET featured_request_status = 'PENDING'
    WHERE id = ? AND seller_id = ?
  `).run(listingId, seller.id);

  return {
    ok: true,
    status: "PENDING",
  };
};
