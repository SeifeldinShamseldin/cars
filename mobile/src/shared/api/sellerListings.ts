import type {
  CarType,
  Condition,
  FuelType,
  Transmission,
  YesNo,
} from "./catalog";
import { fetchJson, patchMultipart, postJson, postMultipart } from "./http";

export type SellerListingImageAsset = {
  uri: string;
  name?: string;
  mimeType?: string;
};

export type SellerListingCreateInput = {
  brand: string;
  model: string;
  bodyType: CarType;
  year: number;
  priceValue: number;
  condition: Condition;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  rimSizeInches: number;
  color: string;
  isNegotiable: YesNo;
  accidentHistory: YesNo;
  description: string;
  images: SellerListingImageAsset[];
};

export type SellerListingCreateResponse = {
  ok: true;
  listingId: string;
  status: "APPROVED";
};

export type SellerListingUpdateInput = SellerListingCreateInput & {
  originalImagePaths: string[];
  retainedImagePaths: string[];
};

export type SellerListingUpdateResponse = {
  ok: true;
  listingId: string;
};

export type SellerListingDeleteResponse = {
  ok: true;
  deleted: true;
  listingId: string;
};

export type SellerOwnedListingStatus = "SHOWN" | "HIDDEN" | "PENDING";

export type SellerOwnedListing = {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  priceValue: number;
  condition: Condition;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  rimSizeInches: number;
  postedAt: string;
  color: string;
  status: SellerOwnedListingStatus;
  featuredRequestStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isFeatured: boolean;
  featuredPosition: number | null;
};

export type SellerOwnedListingsResponse = {
  cars: SellerOwnedListing[];
  total: number;
  nextOffset: number | null;
};

export type SellerListingFeatureRequestResponse = {
  ok: true;
  status: "PENDING";
};

const createSellerAccessHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
});

export const createSellerListing = async ({
  accessToken,
  input,
}: {
  accessToken: string;
  input: SellerListingCreateInput;
}): Promise<SellerListingCreateResponse> => {
  const formData = new FormData();
  formData.append("brand", input.brand);
  formData.append("model", input.model);
  formData.append("bodyType", input.bodyType);
  formData.append("year", String(input.year));
  formData.append("priceValue", String(input.priceValue));
  formData.append("condition", input.condition);
  formData.append("fuelType", input.fuelType);
  formData.append("transmission", input.transmission);
  formData.append("mileage", String(input.mileage));
  formData.append("rimSizeInches", String(input.rimSizeInches));
  formData.append("color", input.color);
  formData.append("isNegotiable", input.isNegotiable);
  formData.append("accidentHistory", input.accidentHistory);
  formData.append("description", input.description);
  for (const image of input.images) {
    formData.append("images", {
      uri: image.uri,
      name: image.name ?? `seller-image-${Date.now()}.jpg`,
      type: image.mimeType ?? "image/jpeg",
    } as never);
  }

  return postMultipart<SellerListingCreateResponse>(
    "/api/sell-cars",
    formData,
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );
};

export const updateSellerListing = async ({
  accessToken,
  listingId,
  input,
}: {
  accessToken: string;
  listingId: string;
  input: SellerListingUpdateInput;
}): Promise<SellerListingUpdateResponse> => {
  const formData = new FormData();
  formData.append("brand", input.brand);
  formData.append("model", input.model);
  formData.append("bodyType", input.bodyType);
  formData.append("year", String(input.year));
  formData.append("priceValue", String(input.priceValue));
  formData.append("condition", input.condition);
  formData.append("fuelType", input.fuelType);
  formData.append("transmission", input.transmission);
  formData.append("mileage", String(input.mileage));
  formData.append("rimSizeInches", String(input.rimSizeInches));
  formData.append("color", input.color);
  formData.append("isNegotiable", input.isNegotiable);
  formData.append("accidentHistory", input.accidentHistory);
  formData.append("description", input.description);

  for (const [index, imagePath] of input.originalImagePaths.entries()) {
    const retainedIndex = input.retainedImagePaths.indexOf(imagePath);
    if (retainedIndex === -1) {
      formData.append(`removeImagePath-${index}`, imagePath);
    } else {
      formData.append(`imageOrder-${index}`, String(retainedIndex + 1));
    }
  }

  for (const image of input.images) {
    formData.append("images", {
      uri: image.uri,
      name: image.name ?? `seller-image-${Date.now()}.jpg`,
      type: image.mimeType ?? "image/jpeg",
    } as never);
  }

  return patchMultipart<SellerListingUpdateResponse>(
    `/api/seller/listings/${encodeURIComponent(listingId)}`,
    formData,
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );
};

export const fetchSellerListings = async ({
  accessToken,
  offset,
  limit,
}: {
  accessToken: string;
  offset: number;
  limit: number;
}): Promise<SellerOwnedListingsResponse> =>
  fetchJson<SellerOwnedListingsResponse>(
    `/api/seller/listings?offset=${offset}&limit=${limit}`,
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );

export const requestSellerListingFeature = async ({
  accessToken,
  listingId,
}: {
  accessToken: string;
  listingId: string;
}): Promise<SellerListingFeatureRequestResponse> =>
  postJson<SellerListingFeatureRequestResponse>(
    `/api/sell-cars/${encodeURIComponent(listingId)}/request-feature`,
    {},
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );

export const deleteSellerListing = async ({
  accessToken,
  listingId,
}: {
  accessToken: string;
  listingId: string;
}): Promise<SellerListingDeleteResponse> =>
  fetchJson<SellerListingDeleteResponse>(
    `/api/seller/listings/${encodeURIComponent(listingId)}`,
    {
      method: "DELETE",
      headers: createSellerAccessHeaders(accessToken),
    },
    { requireSecure: true },
  );
