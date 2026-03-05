import type { SellerProfile } from "../../api/sellerAccess";

export type SellerAccessSlice = {
  sellerAccessToken?: string;
  sellerAccessRefreshToken?: string;
  sellerAccessPhone?: string;
  hasSellerProfile: boolean;
  sellerProfile?: SellerProfile;
};

export const initialSellerAccessSlice: SellerAccessSlice = {
  sellerAccessToken: undefined,
  sellerAccessRefreshToken: undefined,
  sellerAccessPhone: undefined,
  hasSellerProfile: false,
  sellerProfile: undefined,
};
