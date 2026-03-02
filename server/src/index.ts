import { createReadStream, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

import { Server } from "socket.io";

import {
  DEMO_CARS,
  getCatalogCarById,
  getCarsByCategory,
  toCatalogCarDetailDto,
  toCatalogCarSummaryDto,
  type CarCategory,
} from "./data/demoCars";
import {
  getCarReferenceBrands,
  getCarReferenceModelGroups,
} from "./data/carReference";
import { registerHandlers } from "./core/socket/registerHandlers";
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

const writeCorsPreflight = (res: ServerResponse): void => {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

const getPagedCategoryPayload = (
  category: CarCategory,
  baseUrl: string,
  offset: number,
  limit: number,
) => {
  const allCars = getCarsByCategory(category);
  const cars = allCars
    .slice(offset, offset + limit)
    .map((car) => toCatalogCarSummaryDto(car, baseUrl));
  const nextOffset = offset + limit < allCars.length ? offset + limit : null;

  return {
    cars,
    total: allCars.length,
    nextOffset,
  };
};

const httpServer = createServer((req, res) => {
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

  if (req.method === "GET" && requestUrl.pathname === "/api/home/sell-cars") {
    writeJson(res, 200, {
      cars: getCarsByCategory("SELL")
        .slice(0, 5)
        .map((car) => toCatalogCarSummaryDto(car, baseUrl)),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/reference/car-brands") {
    writeJson(res, 200, {
      brands: getCarReferenceBrands(),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/reference/car-models") {
    const brand = requestUrl.searchParams.get("brand") ?? "";
    writeJson(res, 200, {
      brand,
      groups: getCarReferenceModelGroups(brand),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/home/new-cars") {
    writeJson(res, 200, {
      cars: getCarsByCategory("UPDATE")
        .slice(0, 5)
        .map((car) => toCatalogCarSummaryDto(car, baseUrl)),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/sell-cars") {
    const { offset, limit } = parseListParams(requestUrl);
    writeJson(res, 200, getPagedCategoryPayload("SELL", baseUrl, offset, limit));
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/new-cars") {
    const { offset, limit } = parseListParams(requestUrl);
    writeJson(
      res,
      200,
      getPagedCategoryPayload("UPDATE", baseUrl, offset, limit),
    );
    return;
  }

  if (req.method === "GET" && requestUrl.pathname.startsWith("/api/cars/")) {
    const carId = decodeURIComponent(
      requestUrl.pathname.replace("/api/cars/", ""),
    );
    const car = getCatalogCarById(carId);

    if (!car) {
      writeJson(res, 404, {
        code: "CAR_NOT_FOUND",
        message: "Car not found.",
      });
      return;
    }

    writeJson(res, 200, { car: toCatalogCarDetailDto(car, baseUrl) });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/featured-cars") {
    writeJson(res, 200, {
      featuredCars: getCarsByCategory("UPDATE")
        .slice(0, 5)
        .map((car) => toCatalogCarSummaryDto(car, baseUrl)),
      sellCars: getCarsByCategory("SELL")
        .slice(0, 5)
        .map((car) => toCatalogCarSummaryDto(car, baseUrl)),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/featured-car") {
    writeJson(res, 200, {
      featuredCar: toCatalogCarSummaryDto(DEMO_CARS[0], baseUrl),
    });
    return;
  }

  writeJson(res, 404, {
    code: "NOT_FOUND",
    message: "Route not found.",
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
