import { create } from "zustand";

import {
  fetchSellerListings,
  type SellerOwnedListing,
} from "../api/sellerListings";

const PAGE_SIZE = 20;

let initialRequest: Promise<void> | null = null;
let initialRequestOwnerPhone: string | null = null;
let initialRequestId = 0;
let loadMoreRequest: Promise<void> | null = null;
let loadMoreRequestOwnerPhone: string | null = null;
let loadMoreRequestId = 0;

type SellerListingsStore = {
  ownerPhone?: string;
  listings: SellerOwnedListing[];
  total: number;
  nextOffset: number | null;
  hasLoaded: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  ensureLoaded: (payload: { accessToken: string; ownerPhone: string }) => Promise<void>;
  loadMore: (payload: { accessToken: string; ownerPhone: string }) => Promise<void>;
  invalidate: (ownerPhone?: string) => void;
  markFeatureRequestPending: (listingId: string) => void;
  removeListing: (listingId: string) => void;
};

const createEmptyState = () => ({
  listings: [],
  total: 0,
  nextOffset: null,
  hasLoaded: false,
  isLoading: false,
  isLoadingMore: false,
  hasError: false,
});

export const useSellerListingsStore = create<SellerListingsStore>((set, get) => ({
  ownerPhone: undefined,
  ...createEmptyState(),

  ensureLoaded: async ({ accessToken, ownerPhone }) => {
    const state = get();
    if (state.ownerPhone !== ownerPhone) {
      set({
        ownerPhone,
        ...createEmptyState(),
      });
    } else if (state.hasLoaded || state.isLoading) {
      return;
    }

    if (initialRequest && initialRequestOwnerPhone === ownerPhone) {
      return initialRequest;
    }

    const requestId = ++initialRequestId;
    initialRequestOwnerPhone = ownerPhone;

    set((current) => ({
      ownerPhone,
      listings: current.ownerPhone === ownerPhone ? current.listings : [],
      total: current.ownerPhone === ownerPhone ? current.total : 0,
      nextOffset: current.ownerPhone === ownerPhone ? current.nextOffset : null,
      hasLoaded: false,
      isLoading: true,
      isLoadingMore: false,
      hasError: false,
    }));

    initialRequest = fetchSellerListings({
      accessToken,
      offset: 0,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        set((current) =>
          current.ownerPhone !== ownerPhone || initialRequestId !== requestId
            ? current
            : {
                ownerPhone,
                listings: response.cars,
                total: response.total,
                nextOffset: response.nextOffset,
                hasLoaded: true,
                isLoading: false,
                isLoadingMore: false,
                hasError: false,
              },
        );
      })
      .catch(() => {
        set((current) => ({
          ...(current.ownerPhone !== ownerPhone || initialRequestId !== requestId
            ? current
            : {
                ownerPhone,
                listings: current.ownerPhone === ownerPhone ? current.listings : [],
                total: current.ownerPhone === ownerPhone ? current.total : 0,
                nextOffset:
                  current.ownerPhone === ownerPhone ? current.nextOffset : null,
                hasLoaded: false,
                isLoading: false,
                isLoadingMore: false,
                hasError: true,
              }),
        }));
      })
      .finally(() => {
        if (initialRequestId === requestId) {
          initialRequest = null;
          initialRequestOwnerPhone = null;
        }
      });

    return initialRequest;
  },

  loadMore: async ({ accessToken, ownerPhone }) => {
    const state = get();
    if (
      state.ownerPhone !== ownerPhone ||
      state.nextOffset === null ||
      state.isLoading ||
      state.isLoadingMore
    ) {
      return;
    }

    if (loadMoreRequest && loadMoreRequestOwnerPhone === ownerPhone) {
      return loadMoreRequest;
    }

    const requestId = ++loadMoreRequestId;
    loadMoreRequestOwnerPhone = ownerPhone;

    set((current) => ({
      ...current,
      isLoadingMore: true,
      hasError: false,
    }));

    loadMoreRequest = fetchSellerListings({
      accessToken,
      offset: state.nextOffset,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        set((current) => ({
          ...(current.ownerPhone !== ownerPhone || loadMoreRequestId !== requestId
            ? current
            : {
                ...current,
                listings: [...current.listings, ...response.cars],
                total: response.total,
                nextOffset: response.nextOffset,
                hasLoaded: true,
                isLoadingMore: false,
                hasError: false,
              }),
        }));
      })
      .catch(() => {
        set((current) => ({
          ...(current.ownerPhone !== ownerPhone || loadMoreRequestId !== requestId
            ? current
            : {
                ...current,
                isLoadingMore: false,
                hasError: true,
              }),
        }));
      })
      .finally(() => {
        if (loadMoreRequestId === requestId) {
          loadMoreRequest = null;
          loadMoreRequestOwnerPhone = null;
        }
      });

    return loadMoreRequest;
  },

  invalidate: (ownerPhone) =>
    set((current) => ({
      ownerPhone: ownerPhone ?? current.ownerPhone,
      ...createEmptyState(),
    })),

  markFeatureRequestPending: (listingId) =>
    set((current) => ({
      ...current,
      listings: current.listings.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              featuredRequestStatus: "PENDING",
            }
          : listing,
      ),
    })),

  removeListing: (listingId) =>
    set((current) => ({
      ...current,
      listings: current.listings.filter((listing) => listing.id !== listingId),
      total: current.total > 0 ? current.total - 1 : 0,
    })),
}));
