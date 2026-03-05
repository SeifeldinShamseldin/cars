import type { IncomingMessage, ServerResponse } from "node:http";

import {
  cleanupCatalogImages,
  parseMultipartFormData,
  saveUploadedCatalogImages,
} from "../admin/catalog-assets/uploads";
import { getDeletableCatalogImagePaths } from "../admin/catalog-assets/service";
import {
  createSellerListing,
  deleteSellerOwnedListing,
  getSellerOwnedListings,
  getStoredSellerListingImagePaths,
  submitSellerListingFeatureRequest,
  updateSellerOwnedListing,
} from "./service";
import {
  isListingBodyType,
  isListingCondition,
  isListingFuelType,
  isListingTransmission,
  isListingYesNo,
} from "./shared";

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

const parsePaginationParam = ({
  rawValue,
  fallback,
  minimum,
  maximum,
}: {
  rawValue: string | null;
  fallback: number;
  minimum: number;
  maximum: number;
}): number => {
  const parsed = Number(rawValue ?? Number.NaN);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)));
};

const normalizeCatalogImagePath = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith("/assets/catalog/")) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    return parsedUrl.pathname.startsWith("/assets/catalog/")
      ? parsedUrl.pathname
      : trimmed;
  } catch {
    return trimmed;
  }
};

const getRemovedImagePaths = (fields: Record<string, string>): string[] =>
  Object.entries(fields)
    .filter(([key, value]) => key.startsWith("removeImagePath-") && value.trim().length > 0)
    .map(([, value]) => normalizeCatalogImagePath(value));

const getOrderedRetainedImagePaths = ({
  fields,
  previousImagePaths,
  removedImagePaths,
}: {
  fields: Record<string, string>;
  previousImagePaths: string[];
  removedImagePaths: Set<string>;
}): string[] =>
  previousImagePaths
    .filter((imagePath) => !removedImagePaths.has(imagePath))
    .map((imagePath, index) => {
      const rawOrder = Number(fields[`imageOrder-${index}`] ?? index + 1);
      return {
        imagePath,
        order: Number.isFinite(rawOrder) ? rawOrder : index + 1,
        originalIndex: index,
      };
    })
    .sort((left, right) => {
      if (left.order !== right.order) {
        return left.order - right.order;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map((entry) => entry.imagePath);

const parseSellerListingInput = ({
  fields,
  galleryImageUrls,
}: {
  fields: Record<string, string>;
  galleryImageUrls: string[];
}) => {
  const brand = fields.brand?.trim() ?? "";
  const model = fields.model?.trim() ?? "";
  const bodyType = fields.bodyType ?? "";
  const year = Number(fields.year ?? Number.NaN);
  const priceValue = Number(fields.priceValue ?? Number.NaN);
  const condition = fields.condition ?? "";
  const fuelType = fields.fuelType ?? "";
  const transmission = fields.transmission ?? "";
  const mileage = Number(fields.mileage ?? Number.NaN);
  const rimSizeInches = Number(fields.rimSizeInches ?? Number.NaN);
  const color = fields.color?.trim() ?? "";
  const isNegotiable = fields.isNegotiable ?? "";
  const accidentHistory = fields.accidentHistory ?? "";
  const description = fields.description?.trim() ?? "";

  if (
    brand.length === 0 ||
    model.length === 0 ||
    color.length === 0 ||
    description.length === 0 ||
    !Number.isFinite(year) ||
    !Number.isFinite(priceValue) ||
    !Number.isFinite(mileage) ||
    !Number.isFinite(rimSizeInches) ||
    !isListingBodyType(bodyType) ||
    !isListingCondition(condition) ||
    !isListingFuelType(fuelType) ||
    !isListingTransmission(transmission) ||
    !isListingYesNo(isNegotiable) ||
    !isListingYesNo(accidentHistory)
  ) {
    return undefined;
  }

  return {
    brand,
    model,
    bodyType,
    year: Math.floor(year),
    priceValue,
    condition,
    fuelType,
    transmission,
    mileage: Math.floor(mileage),
    rimSizeInches: Math.floor(rimSizeInches),
    color,
    isNegotiable,
    accidentHistory,
    description,
    galleryImageUrls,
  };
};

export const handleSellerListingsRequest = async ({
  req,
  res,
  requestUrl,
  baseUrl,
  writeJson,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  baseUrl: string;
  writeJson: (res: ServerResponse, statusCode: number, payload: unknown) => void;
}): Promise<boolean> => {
  const sellerOwnedListingMatch = requestUrl.pathname.match(/^\/api\/seller\/listings\/([^/]+)$/);

  if (req.method === "GET" && requestUrl.pathname === "/api/seller/listings") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    const offset = parsePaginationParam({
      rawValue: requestUrl.searchParams.get("offset"),
      fallback: 0,
      minimum: 0,
      maximum: 100_000,
    });
    const limit = parsePaginationParam({
      rawValue: requestUrl.searchParams.get("limit"),
      fallback: 20,
      minimum: 1,
      maximum: 20,
    });
    const result = getSellerOwnedListings({
      accessToken,
      baseUrl,
      offset,
      limit,
    });

    if (!result.ok) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    writeJson(res, 200, {
      cars: result.cars,
      total: result.total,
      nextOffset: result.nextOffset,
    });
    return true;
  }

  if (sellerOwnedListingMatch && req.method === "PATCH") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    let formData;
    try {
      formData = await parseMultipartFormData(
        req,
        `${baseUrl}${requestUrl.pathname}`,
        req.method,
        req.headers["content-type"],
      );
    } catch {
      writeJson(res, 400, {
        code: "INVALID_MULTIPART_FORM",
        message: "Failed to read uploaded images.",
      });
      return true;
    }

    const listingId = decodeURIComponent(sellerOwnedListingMatch[1]);
    const previousImagePaths = getStoredSellerListingImagePaths({
      accessToken,
      listingId,
    });
    const removedImagePaths = new Set(getRemovedImagePaths(formData.fields));
    const retainedPreviousImagePaths = getOrderedRetainedImagePaths({
      fields: formData.fields,
      previousImagePaths,
      removedImagePaths,
    });

    let uploadedImageUrls: string[] = [];
    try {
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "seller-listing");
    } catch {
      writeJson(res, 500, {
        code: "ASSET_WRITE_FAILED",
        message: "Failed to save uploaded images.",
      });
      return true;
    }

    const input = parseSellerListingInput({
      fields: formData.fields,
      galleryImageUrls: [...retainedPreviousImagePaths, ...uploadedImageUrls],
    });

    if (!input) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_LISTING_INPUT",
        message: "Invalid sell car payload.",
      });
      return true;
    }

    const result = updateSellerOwnedListing({
      accessToken,
      listingId,
      input,
    });

    if (!result.ok) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(
        res,
        result.code === "UNAUTHORIZED"
          ? 401
          : result.code === "LISTING_NOT_FOUND"
            ? 404
            : 400,
        {
          code: result.code,
          message:
            result.code === "UNAUTHORIZED"
              ? "Seller access token is missing or invalid."
              : result.code === "LISTING_NOT_FOUND"
                ? "Listing not found."
                : "Selected brand and model do not match the reference catalog.",
        },
      );
      return true;
    }

    cleanupCatalogImages(getDeletableCatalogImagePaths([...removedImagePaths]));
    writeJson(res, 200, {
      ok: true,
      listingId: result.listingId,
    });
    return true;
  }

  if (sellerOwnedListingMatch && req.method === "DELETE") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    const listingId = decodeURIComponent(sellerOwnedListingMatch[1]);
    const previousImagePaths = getStoredSellerListingImagePaths({
      accessToken,
      listingId,
    });
    const result = deleteSellerOwnedListing({
      accessToken,
      listingId,
    });

    if (!result.ok) {
      writeJson(res, result.code === "UNAUTHORIZED" ? 401 : 404, {
        code: result.code,
        message:
          result.code === "UNAUTHORIZED"
            ? "Seller access token is missing or invalid."
            : "Listing not found.",
      });
      return true;
    }

    cleanupCatalogImages(getDeletableCatalogImagePaths(previousImagePaths));
    writeJson(res, 200, {
      ok: true,
      deleted: true,
      listingId: result.listingId,
    });
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/sell-cars") {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    let formData;
    try {
      formData = await parseMultipartFormData(
        req,
        `${baseUrl}${requestUrl.pathname}`,
        req.method,
        req.headers["content-type"],
      );
    } catch {
      writeJson(res, 400, {
        code: "INVALID_MULTIPART_FORM",
        message: "Failed to read uploaded images.",
      });
      return true;
    }

    let uploadedImageUrls: string[] = [];
    try {
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "seller-listing");
      const input = parseSellerListingInput({
        fields: formData.fields,
        galleryImageUrls: uploadedImageUrls,
      });

      if (!input) {
        cleanupCatalogImages(uploadedImageUrls);
        writeJson(res, 400, {
          code: "INVALID_LISTING_INPUT",
          message: "Invalid sell car payload.",
        });
        return true;
      }

      const result = createSellerListing({ accessToken, input });
      if (!result.ok) {
        cleanupCatalogImages(uploadedImageUrls);
        writeJson(res, result.code === "UNAUTHORIZED" ? 401 : 400, {
          code: result.code,
          message:
            result.code === "UNAUTHORIZED"
              ? "Seller access token is missing or invalid."
              : "Selected brand and model do not match the reference catalog.",
        });
        return true;
      }

      writeJson(res, 201, {
        ok: true,
        listingId: result.listingId,
        status: result.status,
      });
      return true;
    } catch {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 500, {
        code: "LISTING_CREATE_FAILED",
        message: "Failed to create sell car listing.",
      });
      return true;
    }
  }

  const requestFeatureMatch = requestUrl.pathname.match(/^\/api\/sell-cars\/([^/]+)\/request-feature$/);
  if (req.method === "POST" && requestFeatureMatch) {
    const accessToken = getSellerAccessTokenFromRequest(req);
    if (accessToken.length === 0) {
      writeJson(res, 401, {
        code: "UNAUTHORIZED",
        message: "Seller access token is missing or invalid.",
      });
      return true;
    }

    const [, rawListingId] = requestFeatureMatch;
    const result = submitSellerListingFeatureRequest({
      accessToken,
      listingId: decodeURIComponent(rawListingId),
    });

    if (result.ok) {
      writeJson(res, 200, {
        ok: true,
        status: result.status,
      });
      return true;
    }

    const statusCode =
      result.code === "UNAUTHORIZED"
        ? 401
        : result.code === "LISTING_NOT_FOUND"
          ? 404
          : 409;

    writeJson(res, statusCode, {
      code: result.code,
      message:
        result.code === "UNAUTHORIZED"
          ? "Seller access token is missing or invalid."
          : result.code === "LISTING_NOT_FOUND"
            ? "Listing not found."
            : result.code === "LISTING_NOT_APPROVED"
              ? "Only approved sell cars can request featured placement."
              : result.code === "ALREADY_FEATURED"
                ? "This sell car is already featured."
                : "A featured request is already pending for this sell car.",
    });
    return true;
  }

  return false;
};
