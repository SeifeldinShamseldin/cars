import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const sqliteDbPath = path.resolve(__dirname, "../../sqlite/dev.sqlite");

let readOnlyDb: DatabaseSync | null = null;
let writableDb: DatabaseSync | null = null;

const createDb = (readOnly: boolean): DatabaseSync => {
  if (!existsSync(sqliteDbPath)) {
    throw new Error(`SQLite catalog database not found at ${sqliteDbPath}`);
  }

  const db = new DatabaseSync(sqliteDbPath, { open: true, readOnly });
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
};

export const getSqliteDbPath = (): string => sqliteDbPath;

export const getReadOnlySqliteDb = (): DatabaseSync => {
  if (!readOnlyDb) {
    readOnlyDb = createDb(true);
  }

  return readOnlyDb;
};

export const getWritableSqliteDb = (): DatabaseSync => {
  if (!writableDb) {
    writableDb = createDb(false);
  }

  return writableDb;
};

export const parseStoredGalleryImageUrls = (
  rawValue: string,
  baseUrl: string,
): string[] => {
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => (value.startsWith("/") ? `${baseUrl}${value}` : value));
  } catch {
    return [];
  }
};
