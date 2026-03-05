import type { IncomingMessage, ServerResponse } from "node:http";

import {
  cleanupCatalogImages,
  parseMultipartFormData,
  saveUploadedCatalogImages,
} from "../catalog-assets/uploads";
import {
  type AdminUpdatesMode,
  type AdminUpdateFeatureFilter,
  createAdminUpdate,
  deleteAdminUpdate,
  getDeletableCatalogImagePaths,
  getAdminUpdateById,
  getAdminUpdates,
  getStoredAdminUpdateImagePaths,
  getUpdateBodyTypes,
  getUpdateStatusCounts,
  isUpdateBodyType,
  isUpdateStatus,
  updateUpdateFeaturedRequestStatus,
  updateUpdateFeaturedState,
  updateAdminUpdate,
  updateAdminUpdateStatus,
  type UpdateFormInput,
  type UpdateStatus,
} from "./service";
import { renderAdminUpdateCreateHtml, renderAdminUpdateEditHtml } from "./editView";
import { renderAdminUpdatesHtml } from "./view";

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

const parseUpdateInput = ({
  fields,
  galleryImageUrls,
}: {
  fields: Record<string, string>;
  galleryImageUrls: string[];
}): UpdateFormInput | undefined => {
  const brand = fields.brand?.trim() ?? "";
  const model = fields.model?.trim() ?? "";
  const bodyType = fields.bodyType ?? "";
  const year = Number(fields.year ?? NaN);
  const description = fields.description?.trim() ?? "";
  const postedAt = fields.postedAt?.trim() ?? "";
  const status = fields.status ?? "";

  if (
    brand.length === 0 ||
    model.length === 0 ||
    description.length === 0 ||
    postedAt.length === 0 ||
    !Number.isFinite(year) ||
    !isUpdateBodyType(bodyType) ||
    !isUpdateStatus(status)
  ) {
    return undefined;
  }

  return {
    brand,
    model,
    bodyType,
    year: Math.floor(year),
    description,
    postedAt,
    galleryImageUrls,
    status,
  };
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

const isAdminUpdatesMode = (value: string): value is AdminUpdatesMode =>
  value === "MODERATION" || value === "FEATURED";

const isAdminUpdateFeatureFilter = (value: string): value is AdminUpdateFeatureFilter =>
  value === "PENDING" || value === "APPROVED" || value === "REJECTED";

const buildUpdatesLocation = ({
  mode,
  filter,
}: {
  mode: AdminUpdatesMode;
  filter?: UpdateStatus | AdminUpdateFeatureFilter;
}): string => {
  const search = new URLSearchParams();

  if (mode === "FEATURED") {
    search.set("mode", mode);
  }
  if (filter) {
    search.set("filter", filter);
  }

  const query = search.toString();
  return query.length > 0 ? `/admin/updates?${query}` : "/admin/updates";
};

export const handleAdminUpdatesRequest = async ({
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
  if (req.method === "GET" && requestUrl.pathname === "/admin/updates") {
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedStatus = requestUrl.searchParams.get("filter") ?? requestUrl.searchParams.get("status");
    const counts = getUpdateStatusCounts();
    const activeMode =
      requestedMode && isAdminUpdatesMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeStatus =
      activeMode === "FEATURED"
        ? requestedStatus && isAdminUpdateFeatureFilter(requestedStatus)
          ? requestedStatus
          : undefined
        : requestedStatus && isUpdateStatus(requestedStatus)
          ? requestedStatus
        : undefined;

    writeHtml(
      res,
      200,
      renderAdminUpdatesHtml({
        baseUrl,
        activeMode,
        activeStatus,
        counts,
        updates: getAdminUpdates({ baseUrl, mode: activeMode, filter: activeStatus }),
      }),
    );
    return true;
  }

  if (req.method === "GET" && requestUrl.pathname === "/admin/updates/create") {
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedStatus = requestUrl.searchParams.get("filter") ?? requestUrl.searchParams.get("status");
    const activeMode =
      requestedMode && isAdminUpdatesMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeStatus =
      activeMode === "FEATURED"
        ? requestedStatus && isAdminUpdateFeatureFilter(requestedStatus)
          ? requestedStatus
          : undefined
        : requestedStatus && isUpdateStatus(requestedStatus)
          ? requestedStatus
          : undefined;

    writeHtml(
      res,
      200,
      renderAdminUpdateCreateHtml({
        activeMode,
        activeFilter: activeStatus,
        bodyTypes: getUpdateBodyTypes(),
      }),
    );
    return true;
  }

  const editMatch = requestUrl.pathname.match(/^\/admin\/updates\/([^/]+)\/edit$/);

  if (req.method === "GET" && editMatch) {
    const [, rawUpdateId] = editMatch;
    const requestedMode = requestUrl.searchParams.get("mode");
    const requestedStatus = requestUrl.searchParams.get("filter") ?? requestUrl.searchParams.get("status");
    const activeMode =
      requestedMode && isAdminUpdatesMode(requestedMode)
        ? requestedMode
        : "MODERATION";
    const activeStatus =
      activeMode === "FEATURED"
        ? requestedStatus && isAdminUpdateFeatureFilter(requestedStatus)
          ? requestedStatus
          : undefined
        : requestedStatus && isUpdateStatus(requestedStatus)
          ? requestedStatus
          : undefined;
    const update = getAdminUpdateById({
      updateId: decodeURIComponent(rawUpdateId),
      baseUrl,
    });

    if (!update) {
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    writeHtml(
      res,
      200,
      renderAdminUpdateEditHtml({
        update,
        activeMode,
        activeFilter: activeStatus,
        bodyTypes: getUpdateBodyTypes(),
      }),
    );
    return true;
  }

  if (req.method === "POST" && requestUrl.pathname === "/admin/updates/create") {
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
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "admin-update");
    } catch {
      writeJson(res, 500, {
        code: "ASSET_WRITE_FAILED",
        message: "Failed to save uploaded images.",
      });
      return true;
    }

    const input = parseUpdateInput({
      fields: formData.fields,
      galleryImageUrls: uploadedImageUrls,
    });

    if (!input) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_UPDATE_INPUT",
        message: "Invalid update payload.",
      });
      return true;
    }

    createAdminUpdate(input);
    const redirectMode =
      formData.fields.mode && isAdminUpdatesMode(formData.fields.mode)
        ? formData.fields.mode
        : "MODERATION";
    redirect(
      res,
      buildUpdatesLocation({
        mode: redirectMode,
        filter:
          redirectMode === "FEATURED"
            ? formData.fields.filter && isAdminUpdateFeatureFilter(formData.fields.filter)
              ? formData.fields.filter
              : undefined
            : formData.fields.filter && isUpdateStatus(formData.fields.filter)
              ? formData.fields.filter
            : undefined,
      }),
    );
    return true;
  }

  const updateMatch = requestUrl.pathname.match(
    /^\/admin\/updates\/([^/]+)\/(update|hide|show|delete|feature-position|unfeature|feature-request-reject)$/,
  );

  if (req.method !== "POST" || !updateMatch) {
    return false;
  }

  const [, rawUpdateId, action] = updateMatch;
  const updateId = decodeURIComponent(rawUpdateId);

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

    const previousImagePaths = getStoredAdminUpdateImagePaths(updateId);
    const removedImagePaths = new Set(getRemovedImagePaths(formData.fields));
    const retainedPreviousImagePaths = previousImagePaths.filter(
      (imagePath) => !removedImagePaths.has(imagePath),
    );
    let uploadedImageUrls: string[];
    try {
      uploadedImageUrls = saveUploadedCatalogImages(formData.files.images ?? [], "admin-update");
    } catch {
      writeJson(res, 500, {
        code: "ASSET_WRITE_FAILED",
        message: "Failed to save uploaded images.",
      });
      return true;
    }

    const input = parseUpdateInput({
      fields: formData.fields,
      galleryImageUrls: [...retainedPreviousImagePaths, ...uploadedImageUrls],
    });

    if (!input) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 400, {
        code: "INVALID_UPDATE_INPUT",
        message: "Invalid update payload.",
      });
      return true;
    }

    const didUpdate = updateAdminUpdate(updateId, input);
    if (!didUpdate) {
      cleanupCatalogImages(uploadedImageUrls);
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    cleanupCatalogImages(
      getDeletableCatalogImagePaths([...removedImagePaths]),
    );

    redirect(
      res,
      buildUpdatesLocation({
        mode:
          formData.fields.mode && isAdminUpdatesMode(formData.fields.mode)
            ? formData.fields.mode
            : "MODERATION",
        filter:
          formData.fields.mode === "FEATURED"
            ? formData.fields.filter && isAdminUpdateFeatureFilter(formData.fields.filter)
              ? formData.fields.filter
              : undefined
            : formData.fields.filter && isUpdateStatus(formData.fields.filter)
              ? formData.fields.filter
            : undefined,
      }),
    );
    return true;
  }

  const body = await readFormBody(req);
  const requestedMode = body.get("mode");
  const requestedFilter = body.get("filter") ?? body.get("status");
  const mode =
    requestedMode && isAdminUpdatesMode(requestedMode)
      ? requestedMode
      : "MODERATION";
  const filter =
    mode === "FEATURED"
      ? requestedFilter && isAdminUpdateFeatureFilter(requestedFilter)
        ? requestedFilter
        : undefined
      : requestedFilter && isUpdateStatus(requestedFilter)
        ? requestedFilter
      : undefined;

  if (action === "delete") {
    const previousImagePaths = getStoredAdminUpdateImagePaths(updateId);
    const didDelete = deleteAdminUpdate(updateId);
    if (!didDelete) {
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    cleanupCatalogImages(
      getDeletableCatalogImagePaths(previousImagePaths),
    );
    redirect(res, buildUpdatesLocation({ mode, filter }));
    return true;
  }

  if (action === "feature-position") {
    const position = Number(body.get("position") ?? NaN);
    if (!Number.isInteger(position) || position < 1 || position > 5) {
      writeJson(res, 400, {
        code: "INVALID_FEATURED_POSITION",
        message: "Featured position must be between 1 and 5.",
      });
      return true;
    }

    const didChangeFeatured = updateUpdateFeaturedState(updateId, position);
    if (!didChangeFeatured) {
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    redirect(res, buildUpdatesLocation({ mode, filter }));
    return true;
  }

  if (action === "unfeature") {
    const didChangeFeatured = updateUpdateFeaturedState(updateId, null);
    if (!didChangeFeatured) {
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    redirect(res, buildUpdatesLocation({ mode, filter }));
    return true;
  }

  if (action === "feature-request-reject") {
    const didChangeFeatureRequest = updateUpdateFeaturedRequestStatus(updateId, "REJECTED");
    if (!didChangeFeatureRequest) {
      writeJson(res, 404, {
        code: "UPDATE_NOT_FOUND",
        message: "Update not found.",
      });
      return true;
    }

    redirect(res, buildUpdatesLocation({ mode, filter }));
    return true;
  }

  const nextStatus: UpdateStatus = action === "hide" ? "HIDDEN" : "VISIBLE";
  const didChangeStatus = updateAdminUpdateStatus(updateId, nextStatus);

  if (!didChangeStatus) {
    writeJson(res, 404, {
      code: "UPDATE_NOT_FOUND",
      message: "Update not found.",
    });
    return true;
  }

  redirect(res, buildUpdatesLocation({ mode, filter }));
  return true;
};
