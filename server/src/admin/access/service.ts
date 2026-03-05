import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

import { getWritableSqliteDb } from "../../data/sqliteDb";
import { buildSellerIdBase, normalizeEgyptianPhone } from "../shared/phone";

const OTP_TTL_MS = 2 * 60 * 1000;
const PHONE_LOCK_MS = 15 * 60 * 1000;
const ACCESS_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 4;
const EXPIRED_INVITE_RETENTION_MS = 24 * 60 * 60 * 1000;
const EXPIRED_SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;

export type SellerInviteRecord = {
  id: string;
  phone: string;
  expiresAt: string;
  createdAt: string;
};

export type SellerAccessLockRecord = {
  phone: string;
  failedAttempts: number;
  lockedUntil: string;
};

export type SellerAccessSessionRecord = {
  phone: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  grantedAt: string;
};

export type SellerProfileRecord = {
  id: string;
  name: string;
  phone: string;
  sellerType: "OWNER" | "DEALER";
};

export type SellerAccessOverview = {
  invites: SellerInviteRecord[];
  locks: SellerAccessLockRecord[];
  sessions: SellerAccessSessionRecord[];
};

export type SellerAccessVerifyResult =
  | { ok: true; phone: string; accessToken: string; refreshToken: string }
  | { ok: false; code: "LOCKED" | "INVALID" | "EXPIRED"; message: string; lockedUntil?: string };

export type SellerAccessRefreshResult =
  | { ok: true; phone: string; accessToken: string; refreshToken: string }
  | { ok: false; code: "UNAUTHORIZED"; message: string };

export type SellerPinSignInResult =
  | { ok: true; phone: string; accessToken: string; refreshToken: string }
  | { ok: false; code: "LOCKED" | "INVALID"; message: string; lockedUntil?: string };

type SessionRow = {
  id: string;
  seller_id: string | null;
  phone: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
  granted_at: string;
  revoked_at: string | null;
};

const hashCode = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const generateOtpCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, "0");

const nowIso = (): string => new Date().toISOString();

const addMsToIso = (baseIso: string, deltaMs: number): string => {
  const timestamp = Date.parse(baseIso);
  return new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + deltaMs).toISOString();
};

const createInviteId = (): string => `seller_invite_${Date.now()}_${randomBytes(3).toString("hex")}`;
const createSessionId = (): string => `seller_session_${Date.now()}_${randomBytes(3).toString("hex")}`;
const createOpaqueToken = (bytes = 24): string => randomBytes(bytes).toString("hex");
const createPinSalt = (): string => randomBytes(16).toString("hex");

const hasColumn = (table: string, columnName: string): boolean => {
  const db = getWritableSqliteDb();
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
};

const getSellerIdByPhone = (phone: string): string | undefined => {
  const db = getWritableSqliteDb();
  const row = db.prepare(`
    SELECT id
    FROM sellers
    WHERE phone = ?
  `).get(phone) as { id: string } | undefined;

  return row?.id;
};

const syncSellerAccessSellerIdsForPhone = (phone: string): void => {
  const db = getWritableSqliteDb();
  const sellerId = getSellerIdByPhone(phone) ?? null;

  db.prepare(`
    UPDATE seller_access_invites
    SET seller_id = ?
    WHERE phone = ?
  `).run(sellerId, phone);

  db.prepare(`
    UPDATE seller_access_attempts
    SET seller_id = ?
    WHERE phone = ?
  `).run(sellerId, phone);

  db.prepare(`
    UPDATE seller_access_sessions
    SET seller_id = ?
    WHERE phone = ?
  `).run(sellerId, phone);
};

const ensureSellerAccessTables = (): void => {
  const db = getWritableSqliteDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS seller_access_invites (
      id TEXT PRIMARY KEY,
      seller_id TEXT,
      phone TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_seller_access_invites_phone
    ON seller_access_invites (phone);

    CREATE INDEX IF NOT EXISTS idx_seller_access_invites_expires_at
    ON seller_access_invites (expires_at);

    CREATE TABLE IF NOT EXISTS seller_access_attempts (
      phone TEXT PRIMARY KEY,
      seller_id TEXT,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_seller_access_attempts_locked_until
    ON seller_access_attempts (locked_until);

    CREATE TABLE IF NOT EXISTS seller_access_sessions (
      id TEXT PRIMARY KEY,
      seller_id TEXT,
      phone TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL UNIQUE,
      refresh_token TEXT NOT NULL UNIQUE,
      access_expires_at TEXT NOT NULL,
      refresh_expires_at TEXT NOT NULL,
      granted_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_phone
    ON seller_access_sessions (phone);

    CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_access_token
    ON seller_access_sessions (access_token);

    CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_refresh_token
    ON seller_access_sessions (refresh_token);

    CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_refresh_expires_at
    ON seller_access_sessions (refresh_expires_at);
  `);

  if (!hasColumn("seller_access_invites", "seller_id")) {
    db.exec(`ALTER TABLE seller_access_invites ADD COLUMN seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL`);
  }

  if (!hasColumn("seller_access_attempts", "seller_id")) {
    db.exec(`ALTER TABLE seller_access_attempts ADD COLUMN seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL`);
  }

  if (!hasColumn("seller_access_sessions", "seller_id")) {
    db.exec(`ALTER TABLE seller_access_sessions ADD COLUMN seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL`);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_seller_access_invites_seller_id
    ON seller_access_invites (seller_id);

    CREATE INDEX IF NOT EXISTS idx_seller_access_attempts_seller_id
    ON seller_access_attempts (seller_id);

    CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_seller_id
    ON seller_access_sessions (seller_id);

    UPDATE seller_access_invites
    SET seller_id = (
      SELECT sellers.id
      FROM sellers
      WHERE sellers.phone = seller_access_invites.phone
    )
    WHERE seller_id IS NULL;

    UPDATE seller_access_attempts
    SET seller_id = (
      SELECT sellers.id
      FROM sellers
      WHERE sellers.phone = seller_access_attempts.phone
    )
    WHERE seller_id IS NULL;

    UPDATE seller_access_sessions
    SET seller_id = (
      SELECT sellers.id
      FROM sellers
      WHERE sellers.phone = seller_access_sessions.phone
    )
    WHERE seller_id IS NULL;
  `);

  const sellerColumns = db.prepare(`PRAGMA table_info(sellers)`).all() as Array<{ name: string }>;
  const hasPinHash = sellerColumns.some((column) => column.name === "pin_hash");
  if (!hasPinHash) {
    db.exec(`ALTER TABLE sellers ADD COLUMN pin_hash TEXT`);
  }

  const legacyGrantTable = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'seller_access_grants'
  `).get() as { name: string } | undefined;

  const hasSessions = db.prepare(`
    SELECT 1
    FROM seller_access_sessions
    LIMIT 1
  `).get() as { 1: number } | undefined;

  if (!legacyGrantTable || hasSessions) {
    return;
  }

  const legacyRows = db.prepare(`
    SELECT phone, access_token, granted_at, revoked_at
    FROM seller_access_grants
  `).all() as Array<{
    phone: string;
    access_token: string;
    granted_at: string;
    revoked_at: string | null;
  }>;

  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO seller_access_sessions (
      id,
      seller_id,
      phone,
      access_token,
      refresh_token,
      access_expires_at,
      refresh_expires_at,
      granted_at,
      revoked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of legacyRows) {
    insertSession.run(
      createSessionId(),
      getSellerIdByPhone(row.phone) ?? null,
      row.phone,
      row.access_token,
      createOpaqueToken(32),
      addMsToIso(row.granted_at, ACCESS_TTL_MS),
      addMsToIso(row.granted_at, REFRESH_TTL_MS),
      row.granted_at,
      row.revoked_at,
    );
  }
};

export const ensureSellerAccessStateSchema = (): void => {
  ensureSellerAccessTables();
};

const cleanupSellerAccessState = (): void => {
  ensureSellerAccessTables();
  const db = getWritableSqliteDb();
  const now = nowIso();
  const inviteCutoff = new Date(Date.now() - EXPIRED_INVITE_RETENTION_MS).toISOString();
  const sessionCutoff = new Date(Date.now() - EXPIRED_SESSION_RETENTION_MS).toISOString();

  db.prepare(`
    DELETE FROM seller_access_invites
    WHERE expires_at <= ?
  `).run(inviteCutoff);

  db.prepare(`
    DELETE FROM seller_access_attempts
    WHERE locked_until IS NOT NULL AND locked_until <= ?
  `).run(now);

  db.prepare(`
    DELETE FROM seller_access_sessions
    WHERE (revoked_at IS NOT NULL AND revoked_at <= ?)
       OR refresh_expires_at <= ?
  `).run(sessionCutoff, sessionCutoff);
};

const normalizePhoneOrThrow = (phone: string): string => {
  const normalizedPhone = normalizeEgyptianPhone(phone);
  if (normalizedPhone.length === 0) {
    throw new Error("Phone number is required.");
  }

  return normalizedPhone;
};

const normalizePinOrThrow = (pin: string): string => {
  const normalizedPin = pin.trim();
  if (!/^\d{4}$/.test(normalizedPin)) {
    throw new Error("Seller PIN must be exactly 4 digits.");
  }

  return normalizedPin;
};

const hashSellerPin = (pin: string): string => {
  const salt = createPinSalt();
  const derivedKey = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${derivedKey}`;
};

const verifySellerPin = (pin: string, storedHash: string): boolean => {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(pin, salt, 32);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
};

const getLockRow = (phone: string): { failed_attempts: number; locked_until: string | null } | undefined => {
  const db = getWritableSqliteDb();
  return db.prepare(`
    SELECT failed_attempts, locked_until
    FROM seller_access_attempts
    WHERE phone = ?
  `).get(phone) as { failed_attempts: number; locked_until: string | null } | undefined;
};

const recordFailedAttempt = (phone: string): string | undefined => {
  const db = getWritableSqliteDb();
  const current = getLockRow(phone);
  const nextFailedAttempts = (current?.failed_attempts ?? 0) + 1;
  const sellerId = getSellerIdByPhone(phone) ?? null;
  const lockedUntil =
    nextFailedAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + PHONE_LOCK_MS).toISOString()
      : null;

  db.prepare(`
    INSERT INTO seller_access_attempts (phone, seller_id, failed_attempts, locked_until, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET
      seller_id = excluded.seller_id,
      failed_attempts = excluded.failed_attempts,
      locked_until = excluded.locked_until,
      updated_at = excluded.updated_at
  `).run(phone, sellerId, nextFailedAttempts, lockedUntil, nowIso());

  return lockedUntil ?? undefined;
};

const clearAttempts = (phone: string): void => {
  getWritableSqliteDb().prepare(`DELETE FROM seller_access_attempts WHERE phone = ?`).run(phone);
};

const createOrReplaceSession = (phone: string): { accessToken: string; refreshToken: string } => {
  const db = getWritableSqliteDb();
  const grantedAt = nowIso();
  const sellerId = getSellerIdByPhone(phone) ?? null;
  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken(32);

  db.prepare(`
    INSERT INTO seller_access_sessions (
      id,
      seller_id,
      phone,
      access_token,
      refresh_token,
      access_expires_at,
      refresh_expires_at,
      granted_at,
      revoked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(phone) DO UPDATE SET
      seller_id = excluded.seller_id,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      access_expires_at = excluded.access_expires_at,
      refresh_expires_at = excluded.refresh_expires_at,
      granted_at = excluded.granted_at,
      revoked_at = NULL
  `).run(
    createSessionId(),
    sellerId,
    phone,
    accessToken,
    refreshToken,
    addMsToIso(grantedAt, ACCESS_TTL_MS),
    addMsToIso(grantedAt, REFRESH_TTL_MS),
    grantedAt,
  );

  return { accessToken, refreshToken };
};

const getSessionByAccessToken = (accessToken: string): SessionRow | undefined => {
  const db = getWritableSqliteDb();
  return db.prepare(`
    SELECT
      id,
      seller_id,
      phone,
      access_token,
      refresh_token,
      access_expires_at,
      refresh_expires_at,
      granted_at,
      revoked_at
    FROM seller_access_sessions
    WHERE access_token = ?
      AND revoked_at IS NULL
      AND access_expires_at > ?
      AND refresh_expires_at > ?
  `).get(accessToken, nowIso(), nowIso()) as SessionRow | undefined;
};

const getSessionByRefreshToken = (refreshToken: string): SessionRow | undefined => {
  const db = getWritableSqliteDb();
  return db.prepare(`
    SELECT
      id,
      seller_id,
      phone,
      access_token,
      refresh_token,
      access_expires_at,
      refresh_expires_at,
      granted_at,
      revoked_at
    FROM seller_access_sessions
    WHERE refresh_token = ?
      AND revoked_at IS NULL
      AND refresh_expires_at > ?
  `).get(refreshToken, nowIso()) as SessionRow | undefined;
};

const rotateSessionTokens = (sessionId: string): { accessToken: string; refreshToken: string } => {
  const db = getWritableSqliteDb();
  const grantedAt = nowIso();
  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken(32);

  db.prepare(`
    UPDATE seller_access_sessions
    SET
      access_token = ?,
      refresh_token = ?,
      access_expires_at = ?,
      refresh_expires_at = ?,
      granted_at = ?,
      revoked_at = NULL
    WHERE id = ?
  `).run(
    accessToken,
    refreshToken,
    addMsToIso(grantedAt, ACCESS_TTL_MS),
    addMsToIso(grantedAt, REFRESH_TTL_MS),
    grantedAt,
    sessionId,
  );

  return { accessToken, refreshToken };
};

const revokeSession = (sessionId: string): boolean => {
  const result = getWritableSqliteDb().prepare(`
    UPDATE seller_access_sessions
    SET revoked_at = ?
    WHERE id = ? AND revoked_at IS NULL
  `).run(nowIso(), sessionId);

  return Number(result.changes) > 0;
};

export const getSellerAccessOverview = (): SellerAccessOverview => {
  cleanupSellerAccessState();
  const db = getWritableSqliteDb();

  const invites = db.prepare(`
    SELECT id, phone, expires_at, created_at
    FROM seller_access_invites
    WHERE expires_at > ?
    ORDER BY created_at DESC
  `).all(nowIso()) as Array<{ id: string; phone: string; expires_at: string; created_at: string }>;

  const locks = db.prepare(`
    SELECT phone, failed_attempts, locked_until
    FROM seller_access_attempts
    WHERE locked_until IS NOT NULL
    ORDER BY locked_until DESC
  `).all() as Array<{ phone: string; failed_attempts: number; locked_until: string }>;

  const sessions = db.prepare(`
    SELECT phone, access_expires_at, refresh_expires_at, granted_at
    FROM seller_access_sessions
    WHERE revoked_at IS NULL AND refresh_expires_at > ?
    ORDER BY granted_at DESC
  `).all(nowIso()) as Array<{
    phone: string;
    access_expires_at: string;
    refresh_expires_at: string;
    granted_at: string;
  }>;

  return {
    invites: invites.map((row) => ({
      id: row.id,
      phone: row.phone,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
    locks: locks.map((row) => ({
      phone: row.phone,
      failedAttempts: row.failed_attempts,
      lockedUntil: row.locked_until,
    })),
    sessions: sessions.map((row) => ({
      phone: row.phone,
      accessExpiresAt: row.access_expires_at,
      refreshExpiresAt: row.refresh_expires_at,
      grantedAt: row.granted_at,
    })),
  };
};

export const createSellerInvite = (phone: string): { phone: string; code: string; expiresAt: string } => {
  cleanupSellerAccessState();
  const db = getWritableSqliteDb();
  const normalizedPhone = normalizePhoneOrThrow(phone);
  const sellerId = getSellerIdByPhone(normalizedPhone) ?? null;
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  db.prepare(`
    DELETE FROM seller_access_invites
    WHERE phone = ?
  `).run(normalizedPhone);

  db.prepare(`
    INSERT INTO seller_access_invites (id, seller_id, phone, code_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(createInviteId(), sellerId, normalizedPhone, hashCode(code), expiresAt, nowIso());

  return {
    phone: normalizedPhone,
    code,
    expiresAt,
  };
};

export const revokeSellerInvite = (inviteId: string): boolean => {
  cleanupSellerAccessState();
  const result = getWritableSqliteDb().prepare(`
    DELETE FROM seller_access_invites
    WHERE id = ?
  `).run(inviteId);

  return Number(result.changes) > 0;
};

export const verifySellerAccess = ({
  phone,
  code,
}: {
  phone: string;
  code: string;
}): SellerAccessVerifyResult => {
  cleanupSellerAccessState();
  const db = getWritableSqliteDb();
  const normalizedPhone = normalizePhoneOrThrow(phone);
  const trimmedCode = code.trim();
  const now = nowIso();
  const lock = getLockRow(normalizedPhone);

  if (lock?.locked_until && lock.locked_until > now) {
    return {
      ok: false,
      code: "LOCKED",
      message: "This number is blocked for 15 minutes.",
      lockedUntil: lock.locked_until,
    };
  }

  const invite = db.prepare(`
    SELECT id, code_hash, expires_at
    FROM seller_access_invites
    WHERE phone = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(normalizedPhone) as { id: string; code_hash: string; expires_at: string } | undefined;

  if (!invite) {
    const lockedUntil = recordFailedAttempt(normalizedPhone);
    return lockedUntil
      ? {
          ok: false,
          code: "LOCKED",
          message: "This number is blocked for 15 minutes.",
          lockedUntil,
        }
      : {
          ok: false,
          code: "INVALID",
          message: "Wrong code or phone number.",
        };
  }

  if (invite.expires_at <= now) {
    db.prepare(`DELETE FROM seller_access_invites WHERE id = ?`).run(invite.id);
    const lockedUntil = recordFailedAttempt(normalizedPhone);
    return lockedUntil
      ? {
          ok: false,
          code: "LOCKED",
          message: "This number is blocked for 15 minutes.",
          lockedUntil,
        }
      : {
          ok: false,
          code: "EXPIRED",
          message: "This code expired. Ask the admin for a new code.",
        };
  }

  if (hashCode(trimmedCode) !== invite.code_hash) {
    const lockedUntil = recordFailedAttempt(normalizedPhone);
    return lockedUntil
      ? {
          ok: false,
          code: "LOCKED",
          message: "This number is blocked for 15 minutes.",
          lockedUntil,
        }
      : {
          ok: false,
          code: "INVALID",
          message: "Wrong code or phone number.",
        };
  }

  clearAttempts(normalizedPhone);
  db.prepare(`DELETE FROM seller_access_invites WHERE phone = ?`).run(normalizedPhone);
  const session = createOrReplaceSession(normalizedPhone);

  return {
    ok: true,
    phone: normalizedPhone,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

export const signInSellerAccess = ({
  phone,
  pin,
}: {
  phone: string;
  pin: string;
}): SellerPinSignInResult => {
  cleanupSellerAccessState();
  const db = getWritableSqliteDb();
  const normalizedPhone = normalizePhoneOrThrow(phone);
  const normalizedPin = normalizePinOrThrow(pin);
  const now = nowIso();
  const lock = getLockRow(normalizedPhone);

  if (lock?.locked_until && lock.locked_until > now) {
    return {
      ok: false,
      code: "LOCKED",
      message: "This number is blocked for 15 minutes.",
      lockedUntil: lock.locked_until,
    };
  }

  const seller = db.prepare(`
    SELECT phone, pin_hash
    FROM sellers
    WHERE phone = ?
  `).get(normalizedPhone) as { phone: string; pin_hash: string | null } | undefined;

  if (!seller?.pin_hash || !verifySellerPin(normalizedPin, seller.pin_hash)) {
    const lockedUntil = recordFailedAttempt(normalizedPhone);
    return lockedUntil
      ? {
          ok: false,
          code: "LOCKED",
          message: "This number is blocked for 15 minutes.",
          lockedUntil,
        }
      : {
          ok: false,
          code: "INVALID",
          message: "Wrong phone number or PIN.",
        };
  }

  clearAttempts(normalizedPhone);
  const session = createOrReplaceSession(normalizedPhone);

  return {
    ok: true,
    phone: normalizedPhone,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

export const refreshSellerAccessSession = (refreshToken: string): SellerAccessRefreshResult => {
  cleanupSellerAccessState();
  const normalizedToken = refreshToken.trim();
  if (normalizedToken.length === 0) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Seller refresh token is missing or invalid.",
    };
  }

  const session = getSessionByRefreshToken(normalizedToken);
  if (!session) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Seller refresh token is missing or invalid.",
    };
  }

  const rotatedTokens = rotateSessionTokens(session.id);
  return {
    ok: true,
    phone: session.phone,
    accessToken: rotatedTokens.accessToken,
    refreshToken: rotatedTokens.refreshToken,
  };
};

export const revokeSellerAccessSessionByRefreshToken = (refreshToken: string): boolean => {
  cleanupSellerAccessState();
  const normalizedToken = refreshToken.trim();
  if (normalizedToken.length === 0) {
    return false;
  }

  const session = getSessionByRefreshToken(normalizedToken);
  return session ? revokeSession(session.id) : false;
};

export const revokeSellerAccessSessionByAccessToken = (accessToken: string): boolean => {
  cleanupSellerAccessState();
  const normalizedToken = accessToken.trim();
  if (normalizedToken.length === 0) {
    return false;
  }

  const session = getSessionByAccessToken(normalizedToken);
  return session ? revokeSession(session.id) : false;
};

export const getPhoneBySellerAccessToken = (accessToken: string): string | undefined => {
  cleanupSellerAccessState();
  const normalizedToken = accessToken.trim();
  if (normalizedToken.length === 0) {
    return undefined;
  }

  return getSessionByAccessToken(normalizedToken)?.phone;
};

export const getSellerProfileByPhone = (phone: string): SellerProfileRecord | undefined => {
  const db = getWritableSqliteDb();
  const row = db.prepare(`
    SELECT id, name, phone, seller_type
    FROM sellers
    WHERE phone = ?
  `).get(phone) as
    | { id: string; name: string; phone: string; seller_type: "OWNER" | "DEALER" }
    | undefined;

  return row
    ? {
        id: row.id,
        name: row.name,
        phone: row.phone,
        sellerType: row.seller_type,
      }
    : undefined;
};

export const getSellerProfileByAccessToken = (
  accessToken: string,
): SellerProfileRecord | undefined => {
  const normalizedToken = accessToken.trim();
  if (normalizedToken.length === 0) {
    return undefined;
  }

  const session = getSessionByAccessToken(normalizedToken);
  if (!session) {
    return undefined;
  }

  if (session.seller_id) {
    const db = getWritableSqliteDb();
    const row = db.prepare(`
      SELECT id, name, phone, seller_type
      FROM sellers
      WHERE id = ?
    `).get(session.seller_id) as
      | { id: string; name: string; phone: string; seller_type: "OWNER" | "DEALER" }
      | undefined;

    if (row) {
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        sellerType: row.seller_type,
      };
    }
  }

  return getSellerProfileByPhone(session.phone);
};

export const upsertSellerProfile = ({
  accessToken,
  name,
  phone,
  pin,
  sellerType,
}: {
  accessToken: string;
  name: string;
  phone: string;
  pin: string;
  sellerType: "OWNER" | "DEALER";
}): SellerProfileRecord | undefined => {
  const db = getWritableSqliteDb();
  const grantedPhone = getPhoneBySellerAccessToken(accessToken);
  if (!grantedPhone) {
    return undefined;
  }

  const normalizedPhone = normalizePhoneOrThrow(phone);
  const normalizedPin = normalizePinOrThrow(pin);
  if (normalizedPhone !== grantedPhone) {
    throw new Error("Phone number does not match the verified seller access.");
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Seller name is required.");
  }

  const pinHash = hashSellerPin(normalizedPin);

  const existing = getSellerProfileByPhone(normalizedPhone);
  if (existing) {
    db.prepare(`
      UPDATE sellers
      SET name = ?, seller_type = ?, pin_hash = ?
      WHERE phone = ?
    `).run(trimmedName, sellerType, pinHash, normalizedPhone);
  } else {
    const sellerId = buildSellerIdBase(trimmedName, normalizedPhone);
    db.prepare(`
      INSERT INTO sellers (id, name, phone, seller_type, pin_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(sellerId, trimmedName, normalizedPhone, sellerType, pinHash);
  }

  const profile = getSellerProfileByPhone(normalizedPhone);
  if (!profile) {
    throw new Error("Failed to save seller profile.");
  }

  syncSellerAccessSellerIdsForPhone(normalizedPhone);

  return profile;
};
