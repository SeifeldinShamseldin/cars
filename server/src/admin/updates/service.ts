import { getReadOnlySqliteDb, getWritableSqliteDb, parseStoredGalleryImageUrls } from "../../data/sqliteDb";
import { getDeletableCatalogImagePaths } from "../catalog-assets/service";

export type UpdateStatus = "VISIBLE" | "HIDDEN";
export type UpdateFeatureStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
export type AdminUpdatesMode = "MODERATION" | "FEATURED";
export type AdminUpdateFeatureFilter = "PENDING" | "APPROVED" | "REJECTED";
export type UpdateBodyType =
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

export type AdminUpdateRecord = {
  id: string;
  status: UpdateStatus;
  isFeatured: boolean;
  featuredPosition: number | null;
  featuredRequestStatus: UpdateFeatureStatus;
  brand: string;
  model: string;
  bodyType: UpdateBodyType;
  year: number;
  description: string;
  postedAt: string;
  galleryImageUrls: string[];
};

export type UpdateFormInput = {
  brand: string;
  model: string;
  bodyType: UpdateBodyType;
  year: number;
  description: string;
  postedAt: string;
  galleryImageUrls: string[];
  status: UpdateStatus;
};

type UpdateRow = {
  id: string;
  status: UpdateStatus;
  is_featured: "YES" | "NO";
  featured_position: number | null;
  featured_request_status: UpdateFeatureStatus;
  brand: string;
  model: string;
  body_type: UpdateBodyType;
  year: number;
  description: string;
  posted_at: string;
  gallery_image_urls: string;
};

type UpdateStatusCount = {
  visible: number;
  hidden: number;
  all: number;
  featured: number;
  featureRequestsPending: number;
  featureAll: number;
  featureApproved: number;
  featureRejected: number;
};

const bodyTypes: UpdateBodyType[] = [
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

const updateSelect = `
  SELECT
    id,
    status,
    is_featured,
    featured_position,
    featured_request_status,
    brand,
    model,
    body_type,
    year,
    description,
    posted_at,
    gallery_image_urls
  FROM car_updates
`;

const mapUpdateRow = (row: UpdateRow, baseUrl: string): AdminUpdateRecord => ({
  id: row.id,
  status: row.status,
  isFeatured: row.is_featured === "YES",
  featuredPosition: row.featured_position,
  featuredRequestStatus: row.featured_request_status,
  brand: row.brand,
  model: row.model,
  bodyType: row.body_type,
  year: row.year,
  description: row.description,
  postedAt: row.posted_at,
  galleryImageUrls: parseStoredGalleryImageUrls(row.gallery_image_urls, baseUrl),
});

export const getUpdateBodyTypes = (): UpdateBodyType[] => bodyTypes;

export const isUpdateStatus = (value: string): value is UpdateStatus =>
  value === "VISIBLE" || value === "HIDDEN";

export const isUpdateBodyType = (value: string): value is UpdateBodyType =>
  bodyTypes.includes(value as UpdateBodyType);

export const getUpdateStatusCounts = (): UpdateStatusCount => {
  const db = getReadOnlySqliteDb();
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM car_updates
    GROUP BY status
  `).all() as Array<{ status: UpdateStatus; total: number }>;
  const featureApproved = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_updates
        WHERE status = 'VISIBLE' AND is_featured = 'YES' AND featured_position IS NOT NULL
      `).get() as { total: number }
    ).total,
  );
  const featureRequestsPending = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_updates
        WHERE status = 'VISIBLE' AND featured_request_status = 'PENDING'
      `).get() as { total: number }
    ).total,
  );
  const featureRejected = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_updates
        WHERE status = 'VISIBLE' AND featured_request_status = 'REJECTED'
      `).get() as { total: number }
    ).total,
  );

  const counts: UpdateStatusCount = {
    visible: 0,
    hidden: 0,
    all: 0,
    featured: featureApproved,
    featureRequestsPending,
    featureAll: featureApproved + featureRequestsPending + featureRejected,
    featureApproved,
    featureRejected,
  };

  for (const row of rows) {
    counts.all += Number(row.total);
    if (row.status === "VISIBLE") {
      counts.visible = Number(row.total);
    } else if (row.status === "HIDDEN") {
      counts.hidden = Number(row.total);
    }
  }

  return counts;
};

export const getAdminUpdates = ({
  baseUrl,
  mode,
  filter,
}: {
  baseUrl: string;
  mode: AdminUpdatesMode;
  filter?: UpdateStatus | AdminUpdateFeatureFilter;
}): AdminUpdateRecord[] => {
  const db = getReadOnlySqliteDb();
  const rows = (
    mode === "FEATURED"
      ? filter === "PENDING"
        ? db.prepare(`
            ${updateSelect}
            WHERE status = 'VISIBLE' AND featured_request_status = 'PENDING'
            ORDER BY posted_at DESC, id DESC
          `).all()
        : filter === "APPROVED"
          ? db.prepare(`
              ${updateSelect}
              WHERE status = 'VISIBLE' AND is_featured = 'YES' AND featured_position IS NOT NULL
              ORDER BY featured_position ASC, posted_at DESC, id DESC
            `).all()
          : filter === "REJECTED"
            ? db.prepare(`
                ${updateSelect}
                WHERE status = 'VISIBLE' AND featured_request_status = 'REJECTED'
                ORDER BY posted_at DESC, id DESC
              `).all()
            : db.prepare(`
                ${updateSelect}
                WHERE status = 'VISIBLE' AND (
                  (is_featured = 'YES' AND featured_position IS NOT NULL) OR
                  featured_request_status = 'PENDING' OR
                  featured_request_status = 'REJECTED'
                )
                ORDER BY
                  CASE WHEN is_featured = 'YES' AND featured_position IS NOT NULL THEN 0 ELSE 1 END,
                  CASE WHEN featured_position IS NULL THEN 999 ELSE featured_position END ASC,
                  CASE WHEN featured_request_status = 'PENDING' THEN 0 ELSE 1 END,
                  posted_at DESC,
                  id DESC
              `).all()
      : filter
        ? db.prepare(`
            ${updateSelect}
            WHERE status = ?
            ORDER BY posted_at DESC, id DESC
          `).all(filter)
        : db.prepare(`
            ${updateSelect}
            ORDER BY posted_at DESC, id DESC
          `).all()
  ) as UpdateRow[];

  return rows.map((row) => mapUpdateRow(row, baseUrl));
};

export const getAdminUpdateById = ({
  updateId,
  baseUrl,
}: {
  updateId: string;
  baseUrl: string;
}): AdminUpdateRecord | undefined => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    ${updateSelect}
    WHERE id = ?
  `).get(updateId) as UpdateRow | undefined;

  return row ? mapUpdateRow(row, baseUrl) : undefined;
};

export const createAdminUpdate = (input: UpdateFormInput): string => {
  const db = getWritableSqliteDb();
  const id = `update_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  db.prepare(`
    INSERT INTO car_updates (
      id,
      status,
      is_featured,
      featured_position,
      featured_request_status,
      brand,
      model,
      body_type,
      year,
      description,
      posted_at,
      gallery_image_urls
    ) VALUES (?, ?, 'NO', NULL, 'NONE', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.status,
    input.brand,
    input.model,
    input.bodyType,
    input.year,
    input.description,
    input.postedAt,
    JSON.stringify(input.galleryImageUrls),
  );

  return id;
};

export const updateAdminUpdate = (
  updateId: string,
  input: UpdateFormInput,
): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    UPDATE car_updates
    SET
      status = ?,
      is_featured = CASE
        WHEN ? = 'VISIBLE' THEN is_featured
        ELSE 'NO'
      END,
      featured_position = CASE
        WHEN ? = 'VISIBLE' THEN featured_position
        ELSE NULL
      END,
      featured_request_status = CASE
        WHEN ? = 'VISIBLE' THEN featured_request_status
        ELSE 'NONE'
      END,
      brand = ?,
      model = ?,
      body_type = ?,
      year = ?,
      description = ?,
      posted_at = ?,
      gallery_image_urls = ?
    WHERE id = ?
  `).run(
    input.status,
    input.status,
    input.status,
    input.status,
    input.brand,
    input.model,
    input.bodyType,
    input.year,
    input.description,
    input.postedAt,
    JSON.stringify(input.galleryImageUrls),
    updateId,
  );

  return Number(result.changes) > 0;
};

export const updateAdminUpdateStatus = (
  updateId: string,
  nextStatus: UpdateStatus,
): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    UPDATE car_updates
    SET
      status = ?,
      is_featured = CASE
        WHEN ? = 'VISIBLE' THEN is_featured
        ELSE 'NO'
      END,
      featured_position = CASE
        WHEN ? = 'VISIBLE' THEN featured_position
        ELSE NULL
      END,
      featured_request_status = CASE
        WHEN ? = 'VISIBLE' THEN featured_request_status
        ELSE 'NONE'
      END
    WHERE id = ?
  `).run(nextStatus, nextStatus, nextStatus, nextStatus, updateId);

  return Number(result.changes) > 0;
};

export const deleteAdminUpdate = (updateId: string): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    DELETE FROM car_updates
    WHERE id = ?
  `).run(updateId);

  return Number(result.changes) > 0;
};

export const getStoredAdminUpdateImagePaths = (
  updateId: string,
): string[] => {
  const db = getReadOnlySqliteDb();
  const row = db.prepare(`
    SELECT gallery_image_urls
    FROM car_updates
    WHERE id = ?
  `).get(updateId) as { gallery_image_urls: string } | undefined;

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

export const updateUpdateFeaturedState = (
  updateId: string,
  featuredPosition: number | null,
): boolean => {
  const db = getWritableSqliteDb();
  const current = db.prepare(`
    SELECT id
    FROM car_updates
    WHERE id = ? AND status = 'VISIBLE'
  `).get(updateId) as { id: string } | undefined;

  if (!current) {
    return false;
  }

  db.exec("BEGIN");

  try {
    if (featuredPosition !== null) {
      db.prepare(`
        UPDATE car_updates
        SET
          is_featured = 'NO',
          featured_position = NULL
        WHERE status = 'VISIBLE' AND featured_position = ? AND id != ?
      `).run(featuredPosition, updateId);
    }

    const result = db.prepare(`
      UPDATE car_updates
      SET
        is_featured = ?,
        featured_position = ?,
        featured_request_status = CASE
          WHEN ? IS NOT NULL AND featured_request_status = 'PENDING' THEN 'APPROVED'
          WHEN ? IS NULL THEN 'NONE'
          ELSE featured_request_status
        END
      WHERE id = ? AND status = 'VISIBLE'
    `).run(
      featuredPosition !== null ? "YES" : "NO",
      featuredPosition,
      featuredPosition,
      featuredPosition,
      updateId,
    );

    db.exec("COMMIT");
    return Number(result.changes) > 0;
  } catch {
    db.exec("ROLLBACK");
    throw new Error("Failed to update featured update position.");
  }
};

export const updateUpdateFeaturedRequestStatus = (
  updateId: string,
  nextStatus: Exclude<UpdateFeatureStatus, "NONE">,
): boolean => {
  const db = getWritableSqliteDb();
  const result = db.prepare(`
    UPDATE car_updates
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
    WHERE id = ? AND status = 'VISIBLE'
  `).run(nextStatus, nextStatus, nextStatus, updateId);

  return Number(result.changes) > 0;
};

export { getDeletableCatalogImagePaths };
