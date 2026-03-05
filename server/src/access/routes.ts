import type { IncomingMessage, ServerResponse } from "node:http";

import {
  getPhoneBySellerAccessToken,
  getSellerProfileByPhone,
  refreshSellerAccessSession,
  revokeSellerAccessSessionByAccessToken,
  revokeSellerAccessSessionByRefreshToken,
  signInSellerAccess,
  upsertSellerProfile,
  verifySellerAccess,
} from "../admin/access/service";

const readFormBody = async (req: IncomingMessage): Promise<URLSearchParams> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
};

const readJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
};

const readPayload = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    return readJsonBody(req);
  }

  const form = await readFormBody(req);
  return Object.fromEntries(form.entries());
};

const getSellerAccessTokenFromRequest = (req: IncomingMessage): string => {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const headerToken = req.headers["x-seller-access-token"];
  if (typeof headerToken === "string") {
    return headerToken.trim();
  }

  return "";
};

const getSellerRefreshTokenFromRequest = (req: IncomingMessage, payload?: Record<string, unknown>): string => {
  const headerToken = req.headers["x-seller-refresh-token"];
  if (typeof headerToken === "string" && headerToken.trim().length > 0) {
    return headerToken.trim();
  }

  const bodyToken = payload?.refreshToken;
  return typeof bodyToken === "string" ? bodyToken.trim() : "";
};

export const handleSellerAccessRequest = async ({
  req,
  res,
  requestUrl,
  writeJson,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  writeJson: (res: ServerResponse, statusCode: number, payload: unknown) => void;
}): Promise<boolean> => {
  if (req.method === "POST" && requestUrl.pathname === "/api/seller-access/verify") {
    try {
      const payload = await readPayload(req);
      const phone = typeof payload.phone === "string" ? payload.phone : "";
      const code = typeof payload.code === "string" ? payload.code : "";
      const result = verifySellerAccess({ phone, code });

      if (result.ok) {
        writeJson(res, 200, {
          ok: true,
          phone: result.phone,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        return true;
      }

      writeJson(res, result.code === "LOCKED" ? 429 : result.code === "EXPIRED" ? 410 : 401, {
        code: result.code,
        message: result.message,
        ...(result.lockedUntil ? { lockedUntil: result.lockedUntil } : {}),
      });
    } catch (error) {
      writeJson(res, 400, {
        code: "INVALID_PHONE",
        message: error instanceof Error ? error.message : "Invalid phone number.",
      });
    }

    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/seller-access/sign-in") {
    try {
      const payload = await readPayload(req);
      const phone = typeof payload.phone === "string" ? payload.phone : "";
      const pin = typeof payload.pin === "string" ? payload.pin : "";
      const result = signInSellerAccess({ phone, pin });

      if (result.ok) {
        writeJson(res, 200, {
          ok: true,
          phone: result.phone,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        return true;
      }

      writeJson(res, result.code === "LOCKED" ? 429 : 401, {
        code: result.code,
        message: result.message,
        ...(result.lockedUntil ? { lockedUntil: result.lockedUntil } : {}),
      });
    } catch (error) {
      writeJson(res, 400, {
        code: "INVALID_PIN",
        message: error instanceof Error ? error.message : "Invalid seller PIN.",
      });
    }

    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/seller-access/verify") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    const grantedPhone = getPhoneBySellerAccessToken(accessToken);

    if (!grantedPhone) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    const profile = getSellerProfileByPhone(grantedPhone);
    writeJson(res, 200, {
      ok: true,
      canAccessNextPage: true,
      hasProfile: Boolean(profile),
      phone: grantedPhone,
      ...(profile
        ? {
            profile: {
              id: profile.id,
              name: profile.name,
              phone: profile.phone,
              sellerType: profile.sellerType,
            },
          }
        : {}),
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/seller-access/refresh") {
    const payload = await readPayload(req);
    const refreshToken = getSellerRefreshTokenFromRequest(req, payload);
    const result = refreshSellerAccessSession(refreshToken);

    if (result.ok) {
      writeJson(res, 200, {
        ok: true,
        phone: result.phone,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return true;
    }

    writeJson(res, 401, {
      code: result.code,
      message: result.message,
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/seller-access/logout") {
    const payload = await readPayload(req);
    const refreshToken = getSellerRefreshTokenFromRequest(req, payload);
    const accessToken = getSellerAccessTokenFromRequest(req);

    const revoked =
      revokeSellerAccessSessionByRefreshToken(refreshToken) ||
      revokeSellerAccessSessionByAccessToken(accessToken);

    writeJson(res, 200, {
      ok: true,
      revoked,
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/seller/profile") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    try {
      const payload = await readPayload(req);
      const name = typeof payload.name === "string" ? payload.name : "";
      const phone = typeof payload.phone === "string" ? payload.phone : "";
      const pin = typeof payload.pin === "string" ? payload.pin : "";
      const sellerType = payload.sellerType;

      if (sellerType !== "OWNER" && sellerType !== "DEALER") {
        writeJson(res, 400, {
          code: "INVALID_SELLER_TYPE",
          message: "Seller type must be OWNER or DEALER.",
        });
        return true;
      }

      const profile = upsertSellerProfile({
        accessToken,
        name,
        phone,
        pin,
        sellerType,
      });

      if (!profile) {
        writeJson(res, 401, {
          code: "UNAUTHORIZED",
          message: "Seller access token is missing or invalid.",
        });
        return true;
      }

      writeJson(res, 200, {
        ok: true,
        profile,
      });
    } catch (error) {
      writeJson(res, 400, {
        code: "INVALID_PROFILE",
        message: error instanceof Error ? error.message : "Invalid seller profile.",
      });
    }

    return true;
  }

  return false;
};
