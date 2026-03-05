import type { SellerType } from "./catalog";
import { fetchJson, postJson } from "./http";

export type SellerProfile = {
  id: string;
  name: string;
  phone: string;
  sellerType: SellerType;
};

export type SellerAccessVerifyResponse = {
  ok: true;
  phone: string;
  accessToken: string;
  refreshToken: string;
};

export type SellerAccessRefreshResponse = {
  ok: true;
  phone: string;
  accessToken: string;
  refreshToken: string;
};

export type SellerPinSignInResponse = {
  ok: true;
  phone: string;
  accessToken: string;
  refreshToken: string;
};

export type SellerAccessSessionResponse = {
  ok: true;
  canAccessNextPage: true;
  hasProfile: boolean;
  phone: string;
  profile?: SellerProfile;
};

export type SaveSellerProfileResponse = {
  ok: true;
  profile: SellerProfile;
};

const createSellerAccessHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
});

export const verifySellerAccessCode = async ({
  phone,
  code,
}: {
  phone: string;
  code: string;
}): Promise<SellerAccessVerifyResponse> =>
  postJson<SellerAccessVerifyResponse>(
    "/api/seller-access/verify",
    { phone, code },
    undefined,
    { requireSecure: true },
  );

export const refreshSellerAccessSession = async (
  refreshToken: string,
): Promise<SellerAccessRefreshResponse> =>
  postJson<SellerAccessRefreshResponse>(
    "/api/seller-access/refresh",
    { refreshToken },
    {
      headers: {
        "x-seller-refresh-token": refreshToken,
      },
    },
    { requireSecure: true },
  );

export const signInSellerWithPin = async ({
  phone,
  pin,
}: {
  phone: string;
  pin: string;
}): Promise<SellerPinSignInResponse> =>
  postJson<SellerPinSignInResponse>(
    "/api/seller-access/sign-in",
    { phone, pin },
    undefined,
    { requireSecure: true },
  );

export const fetchSellerAccessSession = async (
  accessToken: string,
): Promise<SellerAccessSessionResponse> =>
  fetchJson<SellerAccessSessionResponse>(
    "/api/seller-access/verify",
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );

export const saveSellerProfile = async ({
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
  sellerType: SellerType;
}): Promise<SaveSellerProfileResponse> =>
  postJson<SaveSellerProfileResponse>(
    "/api/seller/profile",
    { name, phone, pin, sellerType },
    { headers: createSellerAccessHeaders(accessToken) },
    { requireSecure: true },
  );
