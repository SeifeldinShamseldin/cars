import type { IncomingMessage, ServerResponse } from "node:http";

import {
  type AdminListingsMode,
  createAdminListing,
  deleteAdminListing,
  getAdminListingById,
  getAdminListings,
  getDeletableCatalogImagePaths,
  getListingEditorOptions,
  getListingStatusCounts,
  getStoredAdminListingImagePaths,
  isListingBodyType,
  isListingCondition,
  isListingFuelType,
  isListingSellerType,
  isListingStatus,
  isListingTransmission,
  isListingYesNo,
  updateAdminListing,
  updateListingFeaturedRequestStatus,
  updateListingFeaturedState,
  updateListingStatus,
  type ListingFormInput,
  type ListingStatus,
} from "./service";
import {
  cleanupCatalogImages,
  parseMultipartFormData,
  saveUploadedCatalogImages,
} from "../catalog-assets/uploads";
import { normalizeEgyptianPhone } from "../shared/phone";
import { renderAdminListingCreateHtml, renderAdminListingEditHtml } from "./editView";
import { renderAdminListingsHtml } from "./view";

const readFormBody = async (req: IncomingMessage): Promise<URLSearchParams> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
};

const redirect = (
  res: ServerResponse,
  location: string,
): void => {
  res.writeHead(303, {
    Location: location,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end();
};

const isAdminListingsMode = (value: string): value is AdminListingsMode =>
  value === "MODERATION" || value === "FEATURED";

const buildListingsAdminLocation = ({
  mode,
  filter,
  query,
}: {
  mode: AdminListingsMode;
  filter?: ListingStatus;
  query?: string;
}): string => {
  const search = new URLSearchParams();

  if (mode === "FEATURED") {
    search.set("mode", mode);
  }
  if (filter) {
    search.set("filter", filter);
  }
  if (query && query.trim().length > 0) {
    search.set("q", query.trim());
  }

  const queryString = search.toString();
  return queryString.length > 0 ? `/admin/listings?${queryString}` : "/admin/listings";
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

const parseListingInput = ({
  fields,
  galleryImageUrls,
}: {
  fields: Record<string, string>;
  galleryImageUrls: string[];
}): ListingFormInput | undefined => {
  const brand = fields.brand?.trim() ?? "";
  const model = fields.model?.trim() ?? "";
  const sellerName = fields.sellerName?.trim() ?? "";
  const telephone = normalizeEgyptianPhone(fields.telephone ?? "");
  const sellerType = fields.sellerType ?? "";
  const bodyType = fields.bodyType ?? "";
  const year = Number(fields.year ?? NaN);
  const priceValue = Number(fields.priceValue ?? NaN);
  const condition = fields.condition ?? "";
  const fuelType = fields.fuelType ?? "";
  const transmission = fields.transmission ?? "";
  const mileage = Number(fields.mileage ?? NaN);
  const rimSizeInches = Number(fields.rimSizeInches ?? NaN);
  const color = fields.color?.trim() ?? "";
  const isNegotiable = fields.isNegotiable ?? "";
  const accidentHistory = fields.accidentHistory ?? "";
  const description = fields.description?.trim() ?? "";
  const postedAt = fields.postedAt?.trim() ?? "";

  if (
    brand.length === 0 ||
    model.length === 0 ||
    sellerName.length === 0 ||
    telephone.length === 0 ||
    color.length === 0 ||
    description.length === 0 ||
    postedAt.length === 0 ||
    !Number.isFinite(year) ||
    !Number.isFinite(priceValue) ||
    !Number.isFinite(mileage) ||
    !Number.isFinite(rimSizeInches) ||
    !isListingSellerType(sellerType) ||
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
    sellerName,
    telephone,
    sellerType,
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
    postedAt,
    galleryImageUrls,
  };
};

export const handleAdminListingsRequest = async ({
  req,
  res,
  requestUrl,
  baseUrl,
  writeHtml,
  writeJson,
}: {
  req: IncomingMessage;
  res: ServerResponse;
  requestUrl: URL;
  baseUrl: string;
  writeHtml: (res: ServerResponse, statusCode: number, payload: string) => void;
  writeJson: (res: ServerResponse, statusCode: number, payload: unknown) => void;
}): Promise<boolean> => {
  if (req.method === "GET" && requestUrl.pathname === "/admin/listings") {
    const counts = getListingStatusCounts();
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedFilter = requestUrl.searchParams.get("filter");
    const query = requestUrl.searchParams.get("q") ?? "";
    const activeMode =
      requestedMode && isAdminListingsMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeFilter =
      requestedFilter && isListingStatus(requestedFilter)
        ? requestedFilter
        : activeMode === "MODERATION" && counts.pending > 0
          ? "PENDING"
          : undefined;

    writeHtml(
      res,
      200,
      renderAdminListingsHtml({
        baseUrl,
        activeMode,
        activeFilter,
        counts,
        listings: getAdminListings({
          baseUrl,
          mode: activeMode,
          filter: activeFilter,
          query,
        }),
        query,
      }),
    );
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/admin/listings/create") {
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedFilter = requestUrl.searchParams.get("filter");
    const activeMode =
      requestedMode && isAdminListingsMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeFilter =
      requestedFilter && isListingStatus(requestedFilter)
        ? requestedFilter
        : undefined;

    writeHtml(
      res,
      200,
      renderAdminListingCreateHtml({
        activeMode,
        activeFilter,
        options: getListingEditorOptions(),
      }),
    );
    return true;
  }

  const editMatch = requestUrl.pathname.match(/^\/admin\/listings\/([^/]+)\/edit$/);

  if (req.method === "GET" && editMatch) {
    const [, rawListingId] = editMatch;
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedFilter = requestUrl.searchParams.get("filter");
    const activeMode =
      requestedMode && isAdminListingsMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeFilter =
      requestedFilter && isListingStatus(requestedFilter)
        ? requestedFilter
        : undefined;
    const listing = getAdminListingById({
      listingId: decodeURIComponent(rawListingId),
      baseUrl,
    });

    if (!listing) {
      writeJson(res, 404, {
        code: "LISTING_NOT_FOUND",
        message: "Listing not found.",
      });
      return true;
    }

    writeHtml(
      res,
      200,
      renderAdminListingEditHtml({
        listing,
        activeMode,
        activeFilter,
        options: getListingEditorOptions(),
      }),
    );
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/admin/listings/create") {
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

    let uploadedImageUrls: string[];
    try {
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "admin-listing");
    } catch {
      writeJson(res, 500, {
        code: "ASSET_WRITE_FAILED",
        message: "Failed to save uploaded images.",
      });
      return true;
    }

    const input = parseListingInput({
      fields: formData.fields,
      galleryImageUrls: uploadedImageUrls,
    });

    if (!input) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_LISTING_INPUT",
        message: "Invalid listing payload.",
      });
      return true;
    }

    const createResult = createAdminListing(input);

    if (createResult === "INVALID_MODEL") {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_MODEL",
        message: "Selected brand and model do not match the reference catalog.",
      });
      return true;
    }

    const requestedMode = formData.fields.mode;
    const requestedFilter = formData.fields.filter;
    const requestedQuery = formData.fields.q;
    const mode =
      requestedMode && isAdminListingsMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const filter =
      requestedFilter && isListingStatus(requestedFilter)
        ? requestedFilter
        : undefined;

    redirect(res, buildListingsAdminLocation({ mode, filter, query: requestedQuery }));
    return true;
  }

  const actionMatch = requestUrl.pathname.match(
    /^\/admin\/listings\/([^/]+)\/(approve|reject|delete|feature-position|unfeature|feature-request-reject|update)$/,
  );

  if (req.method !== "POST" || !actionMatch) {
    return false;
  }

  const [, rawListingId, action] = actionMatch;
  const listingId = decodeURIComponent(rawListingId);
  let didUpdate = false;

  if (action === "update") {
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

    const previousImagePaths = getStoredAdminListingImagePaths(listingId);
    const removedImagePaths = new Set(getRemovedImagePaths(formData.fields));
    const retainedPreviousImagePaths = getOrderedRetainedImagePaths({
      fields: formData.fields,
      previousImagePaths,
      removedImagePaths,
    });
    let uploadedImageUrls: string[];
    try {
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "admin-listing");
    } catch {
      writeJson(res, 500, {
        code: "ASSET_WRITE_FAILED",
        message: "Failed to save uploaded images.",
      });
      return true;
    }

    const input = parseListingInput({
      fields: formData.fields,
      galleryImageUrls: [...retainedPreviousImagePaths, ...uploadedImageUrls],
    });

    if (!input) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_LISTING_INPUT",
        message: "Invalid listing payload.",
      });
      return true;
    }

    const updateResult = updateAdminListing(listingId, input);

    if (updateResult === "NOT_FOUND") {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 404, {
        code: "LISTING_NOT_FOUND",
        message: "Listing not found.",
      });
      return true;
    }

    if (updateResult === "INVALID_MODEL") {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_MODEL",
        message: "Selected brand and model do not match the reference catalog.",
      });
      return true;
    }

    cleanupCatalogImages(
      getDeletableCatalogImagePaths([...removedImagePaths]),
    );

    const requestedMode = formData.fields.mode;
    const requestedFilter = formData.fields.filter;
    const requestedQuery = formData.fields.q;
    const mode =
      requestedMode && isAdminListingsMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const filter =
      requestedFilter && isListingStatus(requestedFilter)
        ? requestedFilter
        : undefined;

    redirect(res, buildListingsAdminLocation({ mode, filter, query: requestedQuery }));
    return true;
  }

  const body = await readFormBody(req);
  const requestedMode = body.get("mode");
  const requestedFilter = body.get("filter");
  const requestedQuery = body.get("q") ?? "";
  const mode =
    requestedMode && isAdminListingsMode(requestedMode)
      ? requestedMode
      : "MODERATION";
  const filter =
    requestedFilter && isListingStatus(requestedFilter)
      ? requestedFilter
      : undefined;

  if (action === "delete") {
    const previousImagePaths = getStoredAdminListingImagePaths(listingId);
    const didDelete = deleteAdminListing(listingId);
    if (!didDelete) {
      writeJson(res, 404, {
        code: "LISTING_NOT_FOUND",
        message: "Listing not found.",
      });
      return true;
    }

    cleanupCatalogImages(
      getDeletableCatalogImagePaths(previousImagePaths),
    );
    redirect(res, buildListingsAdminLocation({ mode, filter, query: requestedQuery }));
    return true;
  }

  if (action === "approve" || action === "reject") {
    const nextStatus: ListingStatus = action === "approve" ? "APPROVED" : "REJECTED";
    didUpdate = updateListingStatus(listingId, nextStatus);
  } else if (action === "feature-position") {
    const position = Number(body.get("position") ?? NaN);
    if (!Number.isInteger(position) || position < 1 || position > 5) {
      writeJson(res, 400, {
        code: "INVALID_FEATURED_POSITION",
        message: "Featured position must be between 1 and 5.",
      });
      return true;
    }

    didUpdate = updateListingFeaturedState(listingId, position);
  } else if (action === "unfeature") {
    didUpdate = updateListingFeaturedState(listingId, null);
  } else {
    didUpdate = updateListingFeaturedRequestStatus(listingId, "REJECTED");
  }

  if (!didUpdate) {
    writeJson(res, 404, {
      code: "LISTING_NOT_FOUND",
      message: "Listing not found.",
    });
    return true;
  }

  redirect(res, buildListingsAdminLocation({ mode, filter, query: requestedQuery }));
  return true;
};
