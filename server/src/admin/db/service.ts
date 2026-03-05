import type { DatabaseSync } from "node:sqlite";

import { getWritableSqliteDb } from "../../data/sqliteDb";
import { ensureSellerAccessStateSchema } from "../access/service";
import { cleanupCatalogImages } from "../catalog-assets/uploads";
import { getDeletableCatalogImagePaths } from "../catalog-assets/service";
import { buildSellerIdBase, normalizeEgyptianPhone } from "../shared/phone";

const adminDbTables = [
  "car_brands",
  "car_models",
  "sellers",
  "seller_access_invites",
  "seller_access_attempts",
  "seller_access_sessions",
  "car_listings",
  "car_updates",
] as const;

export type AdminDbTableName = (typeof adminDbTables)[number];

type FieldKind = "text" | "number" | "json" | "enum" | "foreignKey";

export type AdminDbFieldSchema = {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  options?: string[];
  foreignTable?: AdminDbTableName;
};

export type AdminDbTableSchema = {
  table: AdminDbTableName;
  title: string;
  singularTitle: string;
  primaryKey: string;
  fields: AdminDbFieldSchema[];
};

type AdminDbTableSnapshot = {
  name: AdminDbTableName;
  count: number;
};

type AdminDbTableData = {
  table: AdminDbTableName;
  primaryKey: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
  query: string;
};

const tableSchemas: Record<AdminDbTableName, AdminDbTableSchema> = {
  car_brands: {
    table: "car_brands",
    title: "Car Brands",
    singularTitle: "Brand",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "name", label: "Name", kind: "text", required: true },
    ],
  },
  car_models: {
    table: "car_models",
    title: "Car Models",
    singularTitle: "Model",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "brand_id", label: "Brand", kind: "foreignKey", required: true, foreignTable: "car_brands" },
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "group_label", label: "Group Label", kind: "text", required: false },
    ],
  },
  sellers: {
    table: "sellers",
    title: "Sellers",
    singularTitle: "Seller",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "phone", label: "Phone", kind: "text", required: true },
      { name: "seller_type", label: "Seller Type", kind: "enum", required: true, options: ["OWNER", "DEALER"] },
    ],
  },
  seller_access_invites: {
    table: "seller_access_invites",
    title: "Seller Access Invites",
    singularTitle: "Access Invite",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "seller_id", label: "Seller", kind: "foreignKey", required: false, foreignTable: "sellers" },
      { name: "phone", label: "Phone", kind: "text", required: true },
      { name: "code_hash", label: "Code Hash", kind: "text", required: true },
      { name: "expires_at", label: "Expires At", kind: "text", required: true },
      { name: "created_at", label: "Created At", kind: "text", required: true },
    ],
  },
  seller_access_attempts: {
    table: "seller_access_attempts",
    title: "Seller Access Attempts",
    singularTitle: "Access Attempt",
    primaryKey: "phone",
    fields: [
      { name: "phone", label: "Phone", kind: "text", required: true },
      { name: "seller_id", label: "Seller", kind: "foreignKey", required: false, foreignTable: "sellers" },
      { name: "failed_attempts", label: "Failed Attempts", kind: "number", required: true },
      { name: "locked_until", label: "Locked Until", kind: "text", required: false },
      { name: "updated_at", label: "Updated At", kind: "text", required: true },
    ],
  },
  seller_access_sessions: {
    table: "seller_access_sessions",
    title: "Seller Access Sessions",
    singularTitle: "Access Session",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "seller_id", label: "Seller", kind: "foreignKey", required: false, foreignTable: "sellers" },
      { name: "phone", label: "Phone", kind: "text", required: true },
      { name: "access_token", label: "Access Token", kind: "text", required: true },
      { name: "refresh_token", label: "Refresh Token", kind: "text", required: true },
      { name: "access_expires_at", label: "Access Expires At", kind: "text", required: true },
      { name: "refresh_expires_at", label: "Refresh Expires At", kind: "text", required: true },
      { name: "granted_at", label: "Granted At", kind: "text", required: true },
      { name: "revoked_at", label: "Revoked At", kind: "text", required: false },
    ],
  },
  car_listings: {
    table: "car_listings",
    title: "Car Listings",
    singularTitle: "Listing",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "seller_id", label: "Seller", kind: "foreignKey", required: true, foreignTable: "sellers" },
      { name: "model_id", label: "Model", kind: "foreignKey", required: true, foreignTable: "car_models" },
      { name: "status", label: "Status", kind: "enum", required: true, options: ["PENDING", "APPROVED", "REJECTED"] },
      { name: "is_featured", label: "Is Featured", kind: "enum", required: true, options: ["YES", "NO"] },
      { name: "featured_position", label: "Featured Position", kind: "number", required: false },
      { name: "featured_request_status", label: "Feature Request Status", kind: "enum", required: true, options: ["NONE", "PENDING", "APPROVED", "REJECTED"] },
      { name: "body_type", label: "Body Type", kind: "enum", required: true, options: ["SEDAN", "COUPE", "SUV", "HATCHBACK", "CONVERTIBLE", "CABRIOLET", "CROSSOVER", "WAGON", "ESTATE", "PICKUP", "VAN", "MINIVAN", "ROADSTER"] },
      { name: "year", label: "Year", kind: "number", required: true },
      { name: "price_value", label: "Price", kind: "number", required: true },
      { name: "condition", label: "Condition", kind: "enum", required: true, options: ["NEW", "USED"] },
      { name: "fuel_type", label: "Fuel Type", kind: "enum", required: true, options: ["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC", "REEV", "GAS"] },
      { name: "transmission", label: "Transmission", kind: "enum", required: true, options: ["MANUAL", "AUTOMATIC"] },
      { name: "mileage", label: "Mileage", kind: "number", required: true },
      { name: "rim_size_inches", label: "Rim Size Inches", kind: "number", required: true },
      { name: "color", label: "Color", kind: "text", required: true },
      { name: "is_negotiable", label: "Is Negotiable", kind: "enum", required: true, options: ["YES", "NO"] },
      { name: "accident_history", label: "Accident History", kind: "enum", required: true, options: ["YES", "NO"] },
      { name: "description", label: "Description", kind: "text", required: true },
      { name: "posted_at", label: "Posted At", kind: "text", required: true },
      { name: "gallery_image_urls", label: "Gallery Image URLs", kind: "json", required: true },
    ],
  },
  car_updates: {
    table: "car_updates",
    title: "Car Updates",
    singularTitle: "Update",
    primaryKey: "id",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "status", label: "Status", kind: "enum", required: true, options: ["VISIBLE", "HIDDEN"] },
      { name: "is_featured", label: "Is Featured", kind: "enum", required: true, options: ["YES", "NO"] },
      { name: "featured_position", label: "Featured Position", kind: "number", required: false },
      { name: "featured_request_status", label: "Feature Request Status", kind: "enum", required: true, options: ["NONE", "PENDING", "APPROVED", "REJECTED"] },
      { name: "brand", label: "Brand", kind: "text", required: true },
      { name: "model", label: "Model", kind: "text", required: true },
      { name: "body_type", label: "Body Type", kind: "enum", required: true, options: ["SEDAN", "COUPE", "SUV", "HATCHBACK", "CONVERTIBLE", "CABRIOLET", "CROSSOVER", "WAGON", "ESTATE", "PICKUP", "VAN", "MINIVAN", "ROADSTER"] },
      { name: "year", label: "Year", kind: "number", required: true },
      { name: "description", label: "Description", kind: "text", required: true },
      { name: "posted_at", label: "Posted At", kind: "text", required: true },
      { name: "gallery_image_urls", label: "Gallery Image URLs", kind: "json", required: true },
    ],
  },
};

const asTitle = (value: string): string =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getTableSchema = (table: AdminDbTableName): AdminDbTableSchema =>
  tableSchemas[table];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const ensureUniqueId = (
  db: DatabaseSync,
  table: AdminDbTableName,
  baseId: string,
): string => {
  let candidate = baseId;
  let suffix = 2;

  while (db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const createGeneratedId = (
  db: DatabaseSync,
  table: AdminDbTableName,
  fields: Record<string, string>,
): string => {
  switch (table) {
    case "car_brands":
      return ensureUniqueId(db, table, `brand_${slugify(fields.name ?? "brand")}`);
    case "car_models": {
      const brandId = fields.brand_id ?? "brand";
      const brandRow = db.prepare(`SELECT name FROM car_brands WHERE id = ?`).get(brandId) as { name: string } | undefined;
      return ensureUniqueId(
        db,
        table,
        `model_${slugify(brandRow?.name ?? brandId)}_${slugify(fields.name ?? "model")}`,
      );
    }
    case "sellers": {
      return ensureUniqueId(
        db,
        table,
        buildSellerIdBase(fields.name ?? "seller", fields.phone ?? ""),
      );
    }
    case "seller_access_invites":
      return ensureUniqueId(db, table, `seller_invite_${slugify(fields.phone ?? "invite")}`);
    case "seller_access_attempts":
      return fields.phone ?? "";
    case "seller_access_sessions":
      return ensureUniqueId(db, table, `seller_session_${slugify(fields.phone ?? "session")}`);
    case "car_listings":
      return ensureUniqueId(db, table, `listing_${slugify(fields.model_id ?? "listing")}`);
    case "car_updates":
      return ensureUniqueId(db, table, `update_${slugify(`${fields.brand ?? ""}-${fields.model ?? ""}`) || "update"}`);
  }
};

const parseGalleryJson = (value: string): string => {
  const trimmed = value.trim();
  const parsed = JSON.parse(trimmed) as unknown;
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error("Gallery image URLs must be a JSON array of strings.");
  }

  return JSON.stringify(parsed);
};

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

const getTableCount = (db: DatabaseSync, table: AdminDbTableName): number =>
  Number((db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total);

const getStoredGalleryPaths = (
  db: DatabaseSync,
  table: "car_listings" | "car_updates",
  id: string,
): string[] => {
  const row = db
    .prepare(`SELECT gallery_image_urls FROM ${table} WHERE id = ?`)
    .get(id) as { gallery_image_urls: string } | undefined;

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

const cleanupRemovedGalleryPaths = (
  previousPaths: string[],
  nextPaths: string[],
): void => {
  const removedPaths = previousPaths.filter((path) => !nextPaths.includes(path));
  if (removedPaths.length === 0) {
    return;
  }

  cleanupCatalogImages(getDeletableCatalogImagePaths(removedPaths));
};

const parseFieldValue = (
  field: AdminDbFieldSchema,
  rawValue: string | undefined,
): string | number | null => {
  const value = rawValue ?? "";

  if (!field.required && value.trim().length === 0) {
    return null;
  }

  if (field.required && value.trim().length === 0) {
    throw new Error(`${field.label} is required.`);
  }

  if (field.kind === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${field.label} must be a valid number.`);
    }
    return parsed;
  }

  if (field.kind === "json") {
    return parseGalleryJson(value);
  }

  if (field.kind === "enum" && field.options && !field.options.includes(value)) {
    throw new Error(`${field.label} must be one of: ${field.options.join(", ")}.`);
  }

  return value.trim();
};

const getFormValues = (
  schema: AdminDbTableSchema,
  fields: Record<string, string>,
): Record<string, string | number | null> =>
  Object.fromEntries(
    schema.fields.map((field) => {
      const rawValue =
        schema.table === "sellers" && field.name === "phone"
          ? normalizeEgyptianPhone(fields[field.name] ?? "")
          : fields[field.name];

      return [field.name, parseFieldValue(field, rawValue)];
    }),
  );

const getForeignKeyOptions = (
  db: DatabaseSync,
  foreignTable: AdminDbTableName,
): Array<{ value: string; label: string }> => {
  switch (foreignTable) {
    case "car_brands":
      return (
        db.prepare(`SELECT id, name FROM car_brands ORDER BY name ASC`).all() as Array<{ id: string; name: string }>
      ).map((row) => ({ value: row.id, label: `${row.name} · ${row.id}` }));
    case "car_models":
      return (
        db.prepare(`
          SELECT m.id, b.name AS brand_name, m.name
          FROM car_models m
          INNER JOIN car_brands b ON b.id = m.brand_id
          ORDER BY b.name ASC, m.name ASC
        `).all() as Array<{ id: string; brand_name: string; name: string }>
      ).map((row) => ({ value: row.id, label: `${row.brand_name} ${row.name} · ${row.id}` }));
    case "sellers":
      return (
        db.prepare(`SELECT id, name, phone FROM sellers ORDER BY name ASC`).all() as Array<{ id: string; name: string; phone: string }>
      ).map((row) => ({ value: row.id, label: `${row.name} · ${row.phone} · ${row.id}` }));
    default:
      return [];
  }
};

export const isAdminDbTableName = (value: string): value is AdminDbTableName =>
  adminDbTables.includes(value as AdminDbTableName);

export const getAdminDbSnapshot = (): { tables: AdminDbTableSnapshot[] } => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  return {
    tables: adminDbTables.map((name) => ({
      name,
      count: getTableCount(db, name),
    })),
  };
};

export const getAdminDbTableData = (
  table: AdminDbTableName,
  {
    page = 1,
    pageSize = 100,
    query = "",
  }: {
    page?: number;
    pageSize?: number;
    query?: string;
  } = {},
): AdminDbTableData => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = getTableSchema(table);
  const primaryKey = schema.primaryKey;
  const columns = (
    db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  ).map((column) => column.name);
  const normalizedQuery = query.trim();
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 100;
  const offset = (safePage - 1) * safePageSize;

  if (table === "car_listings") {
    const phoneVariants = normalizedQuery.length > 0 ? getPhoneSearchVariants(normalizedQuery) : [];
    const searchParts: string[] = [];
    const whereValues: Array<string> = [];

    if (normalizedQuery.length > 0) {
      for (const column of columns) {
        searchParts.push(`CAST(l.${column} AS TEXT) LIKE ?`);
        whereValues.push(`%${normalizedQuery}%`);
      }

      searchParts.push("LOWER(s.name) LIKE LOWER(?)");
      whereValues.push(`%${normalizedQuery}%`);

      searchParts.push("LOWER(b.name) LIKE LOWER(?)");
      whereValues.push(`%${normalizedQuery}%`);

      searchParts.push("LOWER(m.name) LIKE LOWER(?)");
      whereValues.push(`%${normalizedQuery}%`);

      for (const variant of phoneVariants) {
        searchParts.push(`
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
          ) LIKE ?
        `);
        whereValues.push(`%${variant}%`);
      }
    }

    const whereClause =
      searchParts.length > 0
        ? `WHERE ${searchParts.join(" OR ")}`
        : "";

    const total = Number(
      (
        db
          .prepare(`
            SELECT COUNT(*) AS total
            FROM car_listings l
            INNER JOIN sellers s ON s.id = l.seller_id
            INNER JOIN car_models m ON m.id = l.model_id
            INNER JOIN car_brands b ON b.id = m.brand_id
            ${whereClause}
          `)
          .get(...whereValues) as { total: number }
      ).total,
    );

    const rows = db
      .prepare(`
        SELECT l.*
        FROM car_listings l
        INNER JOIN sellers s ON s.id = l.seller_id
        INNER JOIN car_models m ON m.id = l.model_id
        INNER JOIN car_brands b ON b.id = m.brand_id
        ${whereClause}
        ORDER BY l.${primaryKey} ASC
        LIMIT ? OFFSET ?
      `)
      .all(...whereValues, safePageSize, offset) as Array<Record<string, unknown>>;

    return {
      table,
      primaryKey,
      columns,
      rows,
      total,
      page: safePage,
      pageSize: safePageSize,
      query: normalizedQuery,
    };
  }

  const phoneLikeColumns = columns.filter((column) => column === "phone" || column === "telephone");
  const phoneVariants = normalizedQuery.length > 0 ? getPhoneSearchVariants(normalizedQuery) : [];
  const searchParts: string[] = [];
  const whereValues: Array<string> = [];

  if (normalizedQuery.length > 0) {
    for (const column of columns) {
      if (column === "phone" || column === "telephone") {
        continue;
      }

      searchParts.push(`CAST(${column} AS TEXT) LIKE ?`);
      whereValues.push(`%${normalizedQuery}%`);
    }

    for (const phoneColumn of phoneLikeColumns) {
      for (const variant of phoneVariants) {
        searchParts.push(`
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(LOWER(${phoneColumn}), ' ', ''),
                  '-', ''
                ),
                '(', ''
              ),
              ')', ''
            ),
            '+', ''
          ) LIKE ?
        `);
        whereValues.push(`%${variant}%`);
      }

      if (phoneVariants.length === 0) {
        searchParts.push(`CAST(${phoneColumn} AS TEXT) LIKE ?`);
        whereValues.push(`%${normalizedQuery}%`);
      }
    }
  }

  const whereClause =
    searchParts.length > 0
      ? `WHERE ${searchParts.join(" OR ")}`
      : "";
  const total = Number(
    (
      db
        .prepare(`SELECT COUNT(*) AS total FROM ${table} ${whereClause}`)
        .get(...whereValues) as { total: number }
    ).total,
  );
  const rows = db
    .prepare(`SELECT * FROM ${table} ${whereClause} ORDER BY ${primaryKey} ASC LIMIT ? OFFSET ?`)
    .all(...whereValues, safePageSize, offset) as Array<Record<string, unknown>>;

  return {
    table,
    primaryKey,
    columns,
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    query: normalizedQuery,
  };
};

export const getAdminDbTableSchema = (
  table: AdminDbTableName,
): {
  schema: AdminDbTableSchema;
  foreignKeyOptions: Record<string, Array<{ value: string; label: string }>>;
} => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = tableSchemas[table];
  const foreignKeyOptions = Object.fromEntries(
    schema.fields
      .filter((field) => field.kind === "foreignKey" && field.foreignTable)
      .map((field) => [field.name, getForeignKeyOptions(db, field.foreignTable!)]),
  );

  return { schema, foreignKeyOptions };
};

export const getAdminDbRow = (
  table: AdminDbTableName,
  rowKey: string,
): Record<string, unknown> | null => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = getTableSchema(table);
  const row = db
    .prepare(`SELECT * FROM ${table} WHERE ${schema.primaryKey} = ?`)
    .get(rowKey) as Record<string, unknown> | undefined;
  return row ?? null;
};

export const createAdminDbRow = (
  table: AdminDbTableName,
  fields: Record<string, string>,
): void => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = tableSchemas[table];
  const createFields =
    schema.primaryKey === "id"
      ? { ...fields, id: createGeneratedId(db, table, fields) }
      : fields;
  const values = getFormValues(schema, createFields);
  const columns = schema.fields.map((field) => field.name);
  const placeholders = columns.map(() => "?").join(", ");

  db.prepare(`
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders})
  `).run(...columns.map((column) => values[column]));
};

export const updateAdminDbRow = (
  table: AdminDbTableName,
  rowKey: string,
  fields: Record<string, string>,
): boolean => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = tableSchemas[table];
  const values = getFormValues(schema, { ...fields, [schema.primaryKey]: rowKey });
  const current = db
    .prepare(`SELECT ${schema.primaryKey} FROM ${table} WHERE ${schema.primaryKey} = ?`)
    .get(rowKey) as Record<string, unknown> | undefined;

  if (!current) {
    return false;
  }

  const previousPaths =
    table === "car_listings" || table === "car_updates"
      ? getStoredGalleryPaths(db, table, rowKey)
      : [];

  const editableFields = schema.fields.filter((field) => field.name !== schema.primaryKey);
  const assignments = editableFields.map((field) => `${field.name} = ?`).join(", ");
  db.prepare(`
    UPDATE ${table}
    SET ${assignments}
    WHERE ${schema.primaryKey} = ?
  `).run(...editableFields.map((field) => values[field.name]), rowKey);

  if (table === "car_listings" || table === "car_updates") {
    const nextPaths =
      typeof values.gallery_image_urls === "string"
        ? JSON.parse(values.gallery_image_urls) as string[]
        : [];
    cleanupRemovedGalleryPaths(previousPaths, nextPaths);
  }

  return true;
};

export const deleteAdminDbRow = (
  table: AdminDbTableName,
  rowKey: string,
): boolean => {
  ensureSellerAccessStateSchema();
  const db = getWritableSqliteDb();
  const schema = getTableSchema(table);
  const previousPaths =
    table === "car_listings" || table === "car_updates"
      ? getStoredGalleryPaths(db, table, rowKey)
      : [];

  const result = db
    .prepare(`DELETE FROM ${table} WHERE ${schema.primaryKey} = ?`)
    .run(rowKey);

  if (Number(result.changes) <= 0) {
    return false;
  }

  if (table === "car_listings" || table === "car_updates") {
    cleanupCatalogImages(getDeletableCatalogImagePaths(previousPaths));
  }

  return true;
};

export const getAdminDbFieldDisplayValue = (
  row: Record<string, unknown> | null,
  field: AdminDbFieldSchema,
): string => {
  if (!row) {
    return "";
  }

  const value = row[field.name];
  if (value === null || value === undefined) {
    return "";
  }

  if (field.kind === "json" && typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return String(value);
};

export const getAdminDbTableTitle = (table: AdminDbTableName): string =>
  tableSchemas[table]?.title ?? asTitle(table);

export const getAdminDbTableSingularTitle = (table: AdminDbTableName): string =>
  tableSchemas[table]?.singularTitle ?? asTitle(table);

export const getAdminDbTablePrimaryKey = (table: AdminDbTableName): string =>
  tableSchemas[table]?.primaryKey ?? "id";
