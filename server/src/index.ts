import { createReadStream, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

import { Server } from "socket.io";

import {
  type CarCategory,
} from "./data/demoCars";
import { handleAdminAccessRequest } from "./admin/access/routes";
import { handleAdminCatalogRequest } from "./admin/catalog/routes";
import { handleAdminDbRequest } from "./admin/db/routes";
import { handleAdminHomeRequest } from "./admin/home/routes";
import { handleAdminListingsRequest } from "./admin/listings/routes";
import { handleAdminRoomsRequest } from "./admin/rooms/routes";
import { handleAdminUpdatesRequest } from "./admin/updates/routes";
import { handleSellerAccessRequest } from "./access/routes";
import { handleSellerListingsRequest } from "./listings/routes";
import { searchSellCars } from "./listings/searchService";
import {
  getCatalogCarsByCategory,
  getCatalogHomePayload,
  getCatalogReferenceCatalog,
} from "./data/catalogSqlite";
import { registerHandlers } from "./core/socket/registerHandlers";
import { createOpenApiDocument, renderSwaggerUiHtml } from "./docs/openapi";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../shared/types/domain";

const port = Number(process.env.PORT ?? 3001);
const catalogAssetsDir = path.resolve(__dirname, "../public/catalog");

const writeJson = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
): void => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
};

const writeHtml = (
  res: ServerResponse,
  statusCode: number,
  payload: string,
): void => {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(payload);
};

const writeCorsPreflight = (res: ServerResponse): void => {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-seller-access-token, x-seller-refresh-token",
  });
  res.end();
};

const getBaseUrl = (req: IncomingMessage): string => {
  const protocolHeader = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(protocolHeader)
    ? protocolHeader[0]
    : protocolHeader ?? "http";
  const host = req.headers.host ?? `localhost:${port}`;

  return `${protocol}://${host}`;
};

const getMimeType = (fileName: string): string => {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

const sendCatalogAsset = (
  req: IncomingMessage,
  res: ServerResponse,
  fileName: string,
): void => {
  const safeFileName = path.basename(decodeURIComponent(fileName));
  const filePath = path.join(catalogAssetsDir, safeFileName);

  if (!existsSync(filePath)) {
    writeJson(res, 404, {
      code: "ASSET_NOT_FOUND",
      message: "Asset not found.",
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": getMimeType(safeFileName),
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
  });
  createReadStream(filePath).pipe(res);
};

const parseListParams = (requestUrl: URL): { offset: number; limit: number } => {
  const rawOffset = Number(requestUrl.searchParams.get("offset") ?? 0);
  const rawLimit = Number(requestUrl.searchParams.get("limit") ?? 20);

  return {
    offset: Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0,
    limit:
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 20)
        : 20,
  };
};

const parseOptionalNumberParam = (value: string | null): number | undefined => {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSellSearchParams = (requestUrl: URL) => ({
  q: requestUrl.searchParams.get("q")?.trim() || undefined,
  brand: requestUrl.searchParams.get("brand")?.trim() || undefined,
  model: requestUrl.searchParams.getAll("model").map((value) => value.trim()).filter(Boolean),
  carType: requestUrl.searchParams.get("carType")?.trim() || undefined,
  priceFrom: parseOptionalNumberParam(requestUrl.searchParams.get("priceFrom")),
  priceTo: parseOptionalNumberParam(requestUrl.searchParams.get("priceTo")),
  yearFrom: parseOptionalNumberParam(requestUrl.searchParams.get("yearFrom")),
  yearTo: parseOptionalNumberParam(requestUrl.searchParams.get("yearTo")),
  condition: requestUrl.searchParams.get("condition")?.trim() || undefined,
  transmission: requestUrl.searchParams.get("transmission")?.trim() || undefined,
  fuelType: requestUrl.searchParams.get("fuelType")?.trim() || undefined,
  mileageFrom: parseOptionalNumberParam(requestUrl.searchParams.get("mileageFrom")),
  mileageTo: parseOptionalNumberParam(requestUrl.searchParams.get("mileageTo")),
});

const handleHttpRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://localhost:${port}`);

  if (requestUrl.pathname.startsWith("/socket.io/")) {
    return;
  }

  if (req.method === "OPTIONS") {
    writeCorsPreflight(res);
    return;
  }

  const baseUrl = getBaseUrl(req);
  const openApiUrl = `${baseUrl}/api-docs/openapi.json`;

  if (
    await handleAdminHomeRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeHtml,
    })
  ) {
    return;
  }

  if (
    await handleAdminAccessRequest({
      req,
      res,
      requestUrl,
      writeHtml,
    })
  ) {
    return;
  }

  if (
    await handleSellerAccessRequest({
      req,
      res,
      requestUrl,
      writeJson,
    })
  ) {
    return;
  }

  if (
    await handleSellerListingsRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeJson,
    })
  ) {
    return;
  }

  if (
    await handleAdminCatalogRequest({
      req,
      res,
      writeJson,
    })
  ) {
    return;
  }

  if (
    await handleAdminListingsRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeHtml,
      writeJson,
    })
  ) {
    return;
  }

  if (
    await handleAdminUpdatesRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeHtml,
      writeJson,
    })
  ) {
    return;
  }

  if (
    await handleAdminRoomsRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeHtml,
    })
  ) {
    return;
  }

  if (
    await handleAdminDbRequest({
      req,
      res,
      requestUrl,
      baseUrl,
      writeHtml,
      writeJson,
    })
  ) {
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/") {
    writeJson(res, 200, {
      name: "Car Party Game server",
      docsUrl: `${baseUrl}/api-docs`,
      openApiUrl,
      adminAccessUrl: `${baseUrl}/admin/access`,
      adminListingsUrl: `${baseUrl}/admin/listings`,
      adminUpdatesUrl: `${baseUrl}/admin/updates`,
      adminDbUrl: `${baseUrl}/admin/db`,
      adminRoomsUrl: `${baseUrl}/admin/rooms`,
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api-docs") {
    writeHtml(res, 200, renderSwaggerUiHtml(openApiUrl));
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api-docs/openapi.json") {
    writeJson(res, 200, createOpenApiDocument(baseUrl));
    return;
  }

  if (
    req.method === "GET" &&
    requestUrl.pathname.startsWith("/assets/catalog/")
  ) {
    sendCatalogAsset(
      req,
      res,
      requestUrl.pathname.replace("/assets/catalog/", ""),
    );
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/home") {
    writeJson(res, 200, getCatalogHomePayload(baseUrl));
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/reference/cars") {
    writeJson(res, 200, getCatalogReferenceCatalog());
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/sell-cars") {
    const { offset, limit } = parseListParams(requestUrl);
    writeJson(res, 200, getCatalogCarsByCategory("SELL", baseUrl, offset, limit));
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/sell-cars/search") {
    const { offset, limit } = parseListParams(requestUrl);
    writeJson(
      res,
      200,
      searchSellCars({
        baseUrl,
        params: parseSellSearchParams(requestUrl),
        offset,
        limit,
      }),
    );
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/new-cars") {
    const { offset, limit } = parseListParams(requestUrl);
    writeJson(
      res,
      200,
      getCatalogCarsByCategory("UPDATE", baseUrl, offset, limit),
    );
    return;
  }

  writeJson(res, 404, {
    code: "NOT_FOUND",
    message: "Route not found.",
  });
};

const httpServer = createServer((req, res) => {
  void handleHttpRequest(req, res).catch((error: unknown) => {
    console.error("HTTP request handling failed", error);

    if (res.headersSent) {
      res.end();
      return;
    }

    writeJson(res, 500, {
      code: "INTERNAL_ERROR",
      message: "Internal server error.",
    });
  });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerHandlers(io);

httpServer.listen(port, () => {
  console.log(`Car Party Game server listening on port ${port}`);
});
