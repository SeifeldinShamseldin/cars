import type { SellerProfile } from "../api/sellerAccess";
import { ApiRequestError } from "../api/http";
import {
  fetchSellerAccessSession,
  refreshSellerAccessSession,
} from "../api/sellerAccess";
import {
  getStoredSellerRefreshToken,
  setStoredSellerRefreshToken,
} from "./storage";

export type ResolvedSellerSession = {
  accessToken: string;
  refreshToken: string;
  phone: string;
  hasProfile: boolean;
  profile?: SellerProfile;
};

type SellerSessionStoreActions = {
  setSellerAccessSession: (payload: {
    accessToken: string;
    refreshToken: string;
    phone: string;
    hasProfile: boolean;
  }) => void;
  setSellerProfile: (profile: SellerProfile) => void;
};

export const applySellerSessionState = ({
  accessToken,
  refreshToken,
  phone,
  hasProfile,
  profile,
  setSellerAccessSession,
  setSellerProfile,
}: ResolvedSellerSession & SellerSessionStoreActions) => {
  setSellerAccessSession({
    accessToken,
    refreshToken,
    phone,
    hasProfile,
  });

  if (profile) {
    setSellerProfile(profile);
  }
};

export const fetchAndApplySellerSession = async ({
  accessToken,
  refreshToken,
  setSellerAccessSession,
  setSellerProfile,
}: {
  accessToken: string;
  refreshToken: string;
} & SellerSessionStoreActions) => {
  const session = await fetchSellerAccessSession(accessToken);
  await setStoredSellerRefreshToken(refreshToken);
  applySellerSessionState({
    accessToken,
    refreshToken,
    phone: session.phone,
    hasProfile: session.hasProfile,
    profile: session.profile,
    setSellerAccessSession,
    setSellerProfile,
  });

  return session;
};

export const resolveSellerAccessSession = async ({
  accessToken,
  refreshToken,
}: {
  accessToken?: string;
  refreshToken?: string;
}): Promise<ResolvedSellerSession> => {
  if (accessToken) {
    try {
      const session = await fetchSellerAccessSession(accessToken);
      return {
        accessToken,
        refreshToken: refreshToken ?? "",
        phone: session.phone,
        hasProfile: session.hasProfile,
        profile: session.profile,
      };
    } catch {
      // Fall through to refresh token recovery.
    }
  }

  const nextRefreshToken = refreshToken ?? (await getStoredSellerRefreshToken());
  if (!nextRefreshToken) {
    throw new ApiRequestError({
      message: "Seller access is unavailable right now.",
      status: 401,
    });
  }

  const refreshed = await refreshSellerAccessSession(nextRefreshToken);
  const session = await fetchSellerAccessSession(refreshed.accessToken);

  return {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    phone: session.phone,
    hasProfile: session.hasProfile,
    profile: session.profile,
  };
};

export const resolveAndApplySellerSession = async ({
  accessToken,
  refreshToken,
  setSellerAccessSession,
  setSellerProfile,
}: {
  accessToken?: string;
  refreshToken?: string;
} & SellerSessionStoreActions): Promise<ResolvedSellerSession> => {
  const session = await resolveSellerAccessSession({
    accessToken,
    refreshToken,
  });
  await setStoredSellerRefreshToken(session.refreshToken);
  applySellerSessionState({
    ...session,
    setSellerAccessSession,
    setSellerProfile,
  });
  return session;
};
