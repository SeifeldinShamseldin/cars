import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useShallow } from "zustand/react/shallow";

import type {
  CarType,
  Condition,
  FuelType,
  Transmission,
  YesNo,
} from "../api/catalog";
import { ApiRequestError } from "../api/http";
import {
  createSellerListing,
  deleteSellerListing,
  requestSellerListingFeature,
  type SellerListingImageAsset,
  type SellerOwnedListing,
  updateSellerListing,
} from "../api/sellerListings";
import {
  formatCatalogEnumLabel,
  formatCatalogPrice,
} from "../lib/catalogPresentation";
import {
  matchesLookupQuery,
  normalizeLookupCompact,
  rankLookupSuggestions,
} from "../lib/lookupSearch";
import { resolveAndApplySellerSession } from "../lib/sellerSession";
import { clearStoredSellerRefreshToken } from "../lib/storage";
import {
  buildSellerEnumOptions,
  SELLER_BODY_TYPE_VALUES,
  SELLER_CONDITION_VALUES,
  SELLER_FUEL_TYPE_VALUES,
  SELLER_TRANSMISSION_VALUES,
  SELLER_YES_NO_VALUES,
} from "../lib/sellerListingOptions";
import { useCatalogStore } from "../store/catalogStore";
import { useSellerListingsStore } from "../store/sellerListingsStore";
import {
  useSellerAccessActions,
  useSellerAccessState,
} from "../store/selectors";

export type SellerListingLayer = "ACCOUNT" | "HISTORY" | "POST";

type SellerDraftImage = {
  key: string;
  uri: string;
  persistedPath?: string;
  upload?: SellerListingImageAsset;
};

const MAX_BRAND_SUGGESTIONS = 8;
const MAX_MODEL_SUGGESTIONS = 8;
const MAX_TYPED_BRAND_SUGGESTIONS = 16;
const MAX_TYPED_MODEL_SUGGESTIONS = 24;

const createDraftImageKey = (): string =>
  `draft-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const extractAssetPath = (imageUrl: string): string | undefined => {
  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.pathname.startsWith("/assets/catalog/")
      ? parsedUrl.pathname
      : undefined;
  } catch {
    return imageUrl.startsWith("/assets/catalog/") ? imageUrl : undefined;
  }
};

const resolveReferenceBrand = ({
  brands,
  query,
  suggestions,
}: {
  brands: string[];
  query: string;
  suggestions: string[];
}): string | undefined => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return undefined;
  }

  const exactMatch = brands.find(
    (brand) => brand.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedQuery = normalizeLookupCompact(trimmedQuery);
  const normalizedMatch = brands.find((brand) => {
    const normalizedBrand = normalizeLookupCompact(brand);
    return (
      normalizedBrand === normalizedQuery ||
      normalizedBrand.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedBrand)
    );
  });
  if (normalizedMatch) {
    return normalizedMatch;
  }

  return suggestions.length === 1 ? suggestions[0] : undefined;
};

const parsePositiveInteger = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.floor(parsed);
};

export const useSellerListingFlow = ({
  labels,
}: {
  labels: {
    accountTitle: string;
    accountSubtitle: string;
    sellerNameLabel: string;
    phoneLabel: string;
    sellerTypeLabel: string;
    logoutLabel: string;
    logoutConfirmTitle: string;
    logoutConfirmMessage: string;
    logoutConfirmAction: string;
    logoutCancelAction: string;
    postSuccessLabel: string;
    editSuccessLabel: string;
    historyTitle: string;
    historySubtitle: string;
    historyLabel: string;
    historyLoadingLabel: string;
    historyErrorLabel: string;
    historyEmptyLabel: string;
    historyLoadingMoreLabel: string;
    historyEditLabel: string;
    historyDeleteLabel: string;
    historyRequestFeatureLabel: string;
    historyFeatureRequestPendingLabel: string;
    historyFeatureRequestRejectedLabel: string;
    historyFeaturedLiveLabel: string;
    historyShownLabel: string;
    historyHiddenLabel: string;
    historyPendingLabel: string;
    historyDeleteConfirmTitle: string;
    historyDeleteConfirmMessage: string;
    historyDeleteConfirmAction: string;
    historyDeleteCancelAction: string;
    postScreenTitle: string;
    postScreenSubtitle: string;
    editScreenTitle: string;
    editScreenSubtitle: string;
    brandLabel: string;
    modelLabel: string;
    yearLabel: string;
    priceLabel: string;
    mileageLabel: string;
    rimSizeLabel: string;
    colorLabel: string;
    descriptionLabel: string;
    bodyTypeLabel: string;
    conditionLabel: string;
    fuelTypeLabel: string;
    transmissionLabel: string;
    negotiableLabel: string;
    accidentHistoryLabel: string;
    photosLabel: string;
    addPhotosLabel: string;
    photosHelperLabel: string;
    removePhotoLabel: string;
    submitLabel: string;
    editSubmitLabel: string;
    backLabel: string;
    brandHelperLabel: string;
    modelHelperLabel: string;
    emptyModelsLabel: string;
    requiredFieldsError: string;
    invalidNumbersError: string;
    invalidReferenceError: string;
    photoPermissionError: string;
    unavailableError: string;
  };
}) => {
  const {
    sellerAccessToken,
    sellerAccessRefreshToken,
    sellerProfile,
  } = useSellerAccessState();
  const {
    setSellerAccessSession,
    clearSellerAccessSession,
    setSellerProfile,
  } = useSellerAccessActions();
  const {
    referenceCatalog,
    ensureReferenceCatalog,
    homeCarsById,
    pagedSellCars,
    pagedUpdateCars,
  } = useCatalogStore(
    useShallow((state) => ({
      referenceCatalog: state.referenceCatalog,
      ensureReferenceCatalog: state.ensureReferenceCatalog,
      homeCarsById: state.home.carsById,
      pagedSellCars: state.paged.SELL.cars,
      pagedUpdateCars: state.paged.UPDATE.cars,
    })),
  );
  const {
      sellerHistoryListings,
      sellerHistoryOwnerPhone,
      sellerHistoryHasLoaded,
      sellerHistoryIsLoading,
      sellerHistoryIsLoadingMore,
      sellerHistoryHasError,
    sellerHistoryNextOffset,
    ensureSellerHistoryLoaded,
    loadMoreSellerHistory,
    invalidateSellerHistory,
    markSellerHistoryFeatureRequestPending,
    removeSellerHistoryListing,
  } = useSellerListingsStore(
    useShallow((state) => ({
      sellerHistoryListings: state.listings,
      sellerHistoryOwnerPhone: state.ownerPhone,
      sellerHistoryHasLoaded: state.hasLoaded,
      sellerHistoryIsLoading: state.isLoading,
      sellerHistoryIsLoadingMore: state.isLoadingMore,
      sellerHistoryHasError: state.hasError,
      sellerHistoryNextOffset: state.nextOffset,
      ensureSellerHistoryLoaded: state.ensureLoaded,
      loadMoreSellerHistory: state.loadMore,
      invalidateSellerHistory: state.invalidate,
      markSellerHistoryFeatureRequestPending: state.markFeatureRequestPending,
      removeSellerHistoryListing: state.removeListing,
    })),
  );

  const [layerStack, setLayerStack] = useState<SellerListingLayer[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [historyStatusMessage, setHistoryStatusMessage] = useState<string | undefined>();
  const [editingListing, setEditingListing] = useState<SellerOwnedListing | undefined>();
  const [brandDraft, setBrandDraft] = useState("");
  const [modelDraft, setModelDraft] = useState("");
  const [brandSelectedFromSuggestion, setBrandSelectedFromSuggestion] = useState(false);
  const [modelSelectedFromSuggestion, setModelSelectedFromSuggestion] = useState(false);
  const [yearDraft, setYearDraft] = useState("");
  const [priceDraft, setPriceDraft] = useState("");
  const [mileageDraft, setMileageDraft] = useState("");
  const [rimSizeDraft, setRimSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [draftImages, setDraftImages] = useState<SellerDraftImage[]>([]);
  const [bodyType, setBodyType] = useState<CarType>("SEDAN");
  const [condition, setCondition] = useState<Condition>("USED");
  const [fuelType, setFuelType] = useState<FuelType>("PETROL");
  const [transmission, setTransmission] = useState<Transmission>("AUTOMATIC");
  const [isNegotiable, setIsNegotiable] = useState<YesNo>("NO");
  const [accidentHistory, setAccidentHistory] = useState<YesNo>("NO");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [historyActionListingId, setHistoryActionListingId] = useState<string | undefined>();
  const [historyActionError, setHistoryActionError] = useState<string | undefined>();

  useEffect(() => {
    void ensureReferenceCatalog().catch(() => undefined);
  }, [ensureReferenceCatalog]);

  const brandSuggestions = useMemo(() => {
    const query = brandDraft.trim();
    const brands = referenceCatalog?.brands ?? [];
    const filtered =
      query.length === 0
        ? brands
        : brands.filter((brand) => matchesLookupQuery(brand, query));
    const ranked = rankLookupSuggestions(filtered, query);
    return ranked.slice(
      0,
      query.length > 0 ? MAX_TYPED_BRAND_SUGGESTIONS : MAX_BRAND_SUGGESTIONS,
    );
  }, [brandDraft, referenceCatalog]);

  const resolvedBrand = useMemo(() => {
    const brands = referenceCatalog?.brands ?? [];
    return resolveReferenceBrand({
      brands,
      query: brandDraft,
      suggestions: brandSuggestions,
    });
  }, [brandDraft, brandSuggestions, referenceCatalog]);

  const availableModels = useMemo(() => {
    if (!resolvedBrand) {
      return [];
    }

    const referenceModels = referenceCatalog
      ? (referenceCatalog.modelGroupsByBrand[resolvedBrand.toLowerCase()] ?? []).flatMap(
          (group) => group.models,
        )
      : [];
    const liveCatalogModels = [
      ...Object.values(homeCarsById),
      ...pagedSellCars,
      ...pagedUpdateCars,
    ]
      .filter((car) => car.brand.toLowerCase() === resolvedBrand.toLowerCase())
      .map((car) => car.model);

    return [...new Set([...referenceModels, ...liveCatalogModels])].sort((left, right) =>
      left.localeCompare(right),
    );
  }, [homeCarsById, pagedSellCars, pagedUpdateCars, referenceCatalog, resolvedBrand]);

  const resolvedModel = useMemo(
    () =>
      availableModels.find(
        (model) => model.toLowerCase() === modelDraft.trim().toLowerCase(),
      ),
    [availableModels, modelDraft],
  );

  const modelSuggestions = useMemo(() => {
    const query = modelDraft.trim();
    const filtered =
      query.length === 0
        ? availableModels
        : availableModels.filter((model) => matchesLookupQuery(model, query));
    const ranked = rankLookupSuggestions(filtered, query);
    return ranked.slice(
      0,
      query.length > 0 ? MAX_TYPED_MODEL_SUGGESTIONS : MAX_MODEL_SUGGESTIONS,
    );
  }, [availableModels, modelDraft]);

  const visibleBrandSuggestions = useMemo(() => {
    const trimmedBrand = brandDraft.trim();
    if (
      brandSelectedFromSuggestion &&
      resolvedBrand &&
      trimmedBrand.length > 0 &&
      trimmedBrand.toLowerCase() === resolvedBrand.toLowerCase()
    ) {
      return [];
    }

    return brandSuggestions;
  }, [brandDraft, brandSelectedFromSuggestion, brandSuggestions, resolvedBrand]);

  const visibleModelSuggestions = useMemo(() => {
    const trimmedModel = modelDraft.trim();
    if (
      modelSelectedFromSuggestion &&
      resolvedModel &&
      trimmedModel.length > 0 &&
      trimmedModel.toLowerCase() === resolvedModel.toLowerCase()
    ) {
      return [];
    }

    return modelSuggestions;
  }, [modelDraft, modelSelectedFromSuggestion, modelSuggestions, resolvedModel]);

  const clearPostDrafts = () => {
    setEditingListing(undefined);
    setBrandDraft("");
    setModelDraft("");
    setBrandSelectedFromSuggestion(false);
    setModelSelectedFromSuggestion(false);
    setYearDraft("");
    setPriceDraft("");
    setMileageDraft("");
    setRimSizeDraft("");
    setColorDraft("");
    setDescriptionDraft("");
    setDraftImages([]);
    setBodyType("SEDAN");
    setCondition("USED");
    setFuelType("PETROL");
    setTransmission("AUTOMATIC");
    setIsNegotiable("NO");
    setAccidentHistory("NO");
    setSubmitError(undefined);
  };

  const ensureActiveSellerSession = useCallback(async () => {
    try {
      const session = await resolveAndApplySellerSession({
        accessToken: sellerAccessToken,
        refreshToken: sellerAccessRefreshToken,
        setSellerAccessSession,
        setSellerProfile,
      });
      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        phone: session.phone,
        hasProfile: session.hasProfile,
      };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw new ApiRequestError({
          message: labels.unavailableError,
          status: error.status,
        });
      }
      throw error;
    }
  }, [
    labels.unavailableError,
    sellerAccessRefreshToken,
    sellerAccessToken,
    setSellerAccessSession,
    setSellerProfile,
  ]);

  const openSellerAccount = () => {
    setHistoryActionError(undefined);
    setHistoryStatusMessage(undefined);
    setLayerStack(["ACCOUNT"]);
  };

  const openSellerPostCar = () => {
    clearPostDrafts();
    setHistoryStatusMessage(undefined);
    setSubmitError(undefined);
    setLayerStack(["POST"]);
  };

  const openSellerEditCar = (listing: SellerOwnedListing) => {
    setEditingListing(listing);
    setBrandDraft(listing.brand);
    setModelDraft(listing.model);
    setBrandSelectedFromSuggestion(true);
    setModelSelectedFromSuggestion(true);
    setYearDraft(String(listing.year));
    setPriceDraft(String(listing.priceValue));
    setMileageDraft(String(listing.mileage));
    setRimSizeDraft(String(listing.rimSizeInches));
    setColorDraft(listing.color);
    setDescriptionDraft(listing.description);
    setBodyType(listing.type);
    setCondition(listing.condition);
    setFuelType(listing.fuelType);
    setTransmission(listing.transmission);
    setIsNegotiable("NO");
    setAccidentHistory("NO");
    setDraftImages(
      listing.galleryImageUrls.map((imageUrl) => ({
        key: createDraftImageKey(),
        uri: imageUrl,
        persistedPath: extractAssetPath(imageUrl),
      })),
    );
    setSubmitError(undefined);
    setHistoryStatusMessage(undefined);
    setLayerStack(["HISTORY", "POST"]);
  };

  const openSellerHistory = async () => {
    setHistoryActionError(undefined);
    setHistoryStatusMessage(undefined);
    setLayerStack(["HISTORY"]);

    try {
      const session = await ensureActiveSellerSession();
      await ensureSellerHistoryLoaded({
        accessToken: session.accessToken,
        ownerPhone: session.phone,
      });
    } catch (error) {
      setHistoryActionError(
        error instanceof ApiRequestError ? error.message : labels.unavailableError,
      );
    }
  };

  const warmSellerHistory = useCallback(async () => {
    if (sellerHistoryIsLoading) {
      return;
    }

    if (
      sellerProfile?.phone &&
      sellerHistoryHasLoaded &&
      sellerHistoryOwnerPhone === sellerProfile.phone
    ) {
      return;
    }

    try {
      const session = await ensureActiveSellerSession();
      await ensureSellerHistoryLoaded({
        accessToken: session.accessToken,
        ownerPhone: session.phone,
      });
    } catch {
      // Warmup should stay silent and never interrupt profile usage.
    }
  }, [
    ensureActiveSellerSession,
    ensureSellerHistoryLoaded,
    sellerHistoryHasLoaded,
    sellerHistoryIsLoading,
    sellerHistoryOwnerPhone,
    sellerProfile?.phone,
  ]);

  const closeSellerListingFlow = () => {
    setLayerStack([]);
    setSubmitError(undefined);
    setHistoryActionError(undefined);
    setHistoryStatusMessage(undefined);
  };

  const logoutSellerAccount = () => {
    Alert.alert(
      labels.logoutConfirmTitle,
      labels.logoutConfirmMessage,
      [
        {
          text: labels.logoutCancelAction,
          style: "cancel",
        },
        {
          text: labels.logoutConfirmAction,
          style: "destructive",
          onPress: () => {
            void (async () => {
              setIsLoggingOut(true);
              try {
                await clearStoredSellerRefreshToken();
              } finally {
                clearSellerAccessSession();
                invalidateSellerHistory();
                closeSellerListingFlow();
                setIsLoggingOut(false);
              }
            })();
          },
        },
      ],
    );
  };

  const closeSellerHistory = () => {
    setLayerStack([]);
    setHistoryActionError(undefined);
    setHistoryStatusMessage(undefined);
  };

  const closeSellerPost = () => {
    setSubmitError(undefined);
    setLayerStack((current) =>
      current.includes("HISTORY") ? ["HISTORY"] : [],
    );
  };

  const pickSellerImages = async () => {
    setSubmitError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError(labels.photoPermissionError);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (result.canceled) {
      return;
    }

    setDraftImages((current) => [
      ...current,
      ...result.assets.map((asset) => ({
        key: createDraftImageKey(),
        uri: asset.uri,
        upload: {
          uri: asset.uri,
          name: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? undefined,
        },
      })),
    ]);
  };

  const submitSellerListing = async () => {
    if (
      !brandDraft.trim() ||
      !modelDraft.trim() ||
      !yearDraft.trim() ||
      !priceDraft.trim() ||
      !mileageDraft.trim() ||
      !rimSizeDraft.trim() ||
      !colorDraft.trim() ||
      !descriptionDraft.trim()
    ) {
      setSubmitError(labels.requiredFieldsError);
      return;
    }

    if (!resolvedBrand || !resolvedModel) {
      setSubmitError(labels.invalidReferenceError);
      return;
    }

    const year = parsePositiveInteger(yearDraft);
    const priceValue = parsePositiveInteger(priceDraft);
    const mileage = parsePositiveInteger(mileageDraft);
    const rimSizeInches = parsePositiveInteger(rimSizeDraft);

    if (!year || !priceValue || mileage === undefined || !rimSizeInches) {
      setSubmitError(labels.invalidNumbersError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const session = await ensureActiveSellerSession();
      const imageUploads = draftImages.flatMap((image) =>
        image.upload ? [image.upload] : [],
      );

      if (editingListing) {
        await updateSellerListing({
          accessToken: session.accessToken,
          listingId: editingListing.id,
          input: {
            brand: resolvedBrand,
            model: resolvedModel,
            bodyType,
            year,
            priceValue,
            condition,
            fuelType,
            transmission,
            mileage,
            rimSizeInches,
            color: colorDraft.trim(),
            isNegotiable,
            accidentHistory,
            description: descriptionDraft.trim(),
            images: imageUploads,
            originalImagePaths: editingListing.galleryImageUrls.flatMap((imageUrl) => {
              const imagePath = extractAssetPath(imageUrl);
              return imagePath ? [imagePath] : [];
            }),
            retainedImagePaths: draftImages.flatMap((image) =>
              image.persistedPath ? [image.persistedPath] : [],
            ),
          },
        });

        invalidateSellerHistory(session.phone);
        await ensureSellerHistoryLoaded({
          accessToken: session.accessToken,
          ownerPhone: session.phone,
        });
        clearPostDrafts();
        setHistoryStatusMessage(labels.editSuccessLabel);
        setLayerStack(["HISTORY"]);
      } else {
        await createSellerListing({
          accessToken: session.accessToken,
          input: {
            brand: resolvedBrand,
            model: resolvedModel,
            bodyType,
            year,
            priceValue,
            condition,
            fuelType,
            transmission,
            mileage,
            rimSizeInches,
            color: colorDraft.trim(),
            isNegotiable,
            accidentHistory,
            description: descriptionDraft.trim(),
            images: imageUploads,
          },
        });

        invalidateSellerHistory(session.phone);
        clearPostDrafts();
        setLayerStack([]);
      }
    } catch (error) {
      setSubmitError(
        error instanceof ApiRequestError ? error.message : labels.unavailableError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const bodyTypeOptions = useMemo(
    () => buildSellerEnumOptions(SELLER_BODY_TYPE_VALUES),
    [],
  );
  const conditionOptions = useMemo(
    () => buildSellerEnumOptions(SELLER_CONDITION_VALUES),
    [],
  );
  const fuelTypeOptions = useMemo(
    () => buildSellerEnumOptions(SELLER_FUEL_TYPE_VALUES),
    [],
  );
  const transmissionOptions = useMemo(
    () => buildSellerEnumOptions(SELLER_TRANSMISSION_VALUES),
    [],
  );
  const yesNoOptions = useMemo(
    () => buildSellerEnumOptions(SELLER_YES_NO_VALUES),
    [],
  );

  const historyCards = useMemo(
    () =>
      sellerHistoryListings.map((listing) => ({
        id: listing.id,
        title: `${listing.brand} ${listing.model}`,
        priceText: formatCatalogPrice(listing.priceValue),
        yearText: String(listing.year),
        statusText:
          listing.status === "SHOWN"
            ? labels.historyShownLabel
            : listing.status === "HIDDEN"
              ? labels.historyHiddenLabel
              : labels.historyPendingLabel,
        featuredStateText: listing.isFeatured
          ? `${labels.historyFeaturedLiveLabel}${listing.featuredPosition ? ` · ${listing.featuredPosition}` : ""}`
          : listing.featuredRequestStatus === "PENDING"
            ? labels.historyFeatureRequestPendingLabel
            : listing.featuredRequestStatus === "REJECTED"
              ? labels.historyFeatureRequestRejectedLabel
              : undefined,
        imageUrl: listing.galleryImageUrls[0],
        editLabel: labels.historyEditLabel,
        deleteLabel: labels.historyDeleteLabel,
        requestFeatureLabel:
          listing.status === "SHOWN" &&
          !listing.isFeatured &&
          listing.featuredRequestStatus === "NONE"
            ? labels.historyRequestFeatureLabel
            : undefined,
        isDeleting: historyActionListingId === listing.id,
        isRequestingFeature: historyActionListingId === listing.id,
        onEdit: () => {
          openSellerEditCar(listing);
        },
        onDelete: () => {
          Alert.alert(
            labels.historyDeleteConfirmTitle,
            labels.historyDeleteConfirmMessage.replace(
              "{value}",
              `${listing.brand} ${listing.model}`,
            ),
            [
              {
                text: labels.historyDeleteCancelAction,
                style: "cancel",
              },
              {
                text: labels.historyDeleteConfirmAction,
                style: "destructive",
                onPress: () => {
                  void (async () => {
                    setHistoryActionListingId(listing.id);
                    setHistoryActionError(undefined);
                    try {
                      const session = await ensureActiveSellerSession();
                      await deleteSellerListing({
                        accessToken: session.accessToken,
                        listingId: listing.id,
                      });
                      removeSellerHistoryListing(listing.id);
                    } catch (error) {
                      setHistoryActionError(
                        error instanceof ApiRequestError
                          ? error.message
                          : labels.unavailableError,
                      );
                    } finally {
                      setHistoryActionListingId(undefined);
                    }
                  })();
                },
              },
            ],
          );
        },
        onRequestFeature:
          listing.status === "SHOWN" &&
          !listing.isFeatured &&
          listing.featuredRequestStatus === "NONE"
            ? () => {
                void (async () => {
                  setHistoryActionListingId(listing.id);
                  setHistoryActionError(undefined);
                  try {
                    const session = await ensureActiveSellerSession();
                    await requestSellerListingFeature({
                      accessToken: session.accessToken,
                      listingId: listing.id,
                    });
                    markSellerHistoryFeatureRequestPending(listing.id);
                  } catch (error) {
                    setHistoryActionError(
                      error instanceof ApiRequestError
                        ? error.message
                        : labels.unavailableError,
                    );
                  } finally {
                    setHistoryActionListingId(undefined);
                  }
                })();
              }
            : undefined,
      })),
    [
      sellerHistoryListings,
      labels.historyShownLabel,
      labels.historyHiddenLabel,
      labels.historyPendingLabel,
      labels.historyFeaturedLiveLabel,
      labels.historyFeatureRequestPendingLabel,
      labels.historyFeatureRequestRejectedLabel,
      labels.historyEditLabel,
      labels.historyDeleteLabel,
      labels.historyRequestFeatureLabel,
      labels.historyDeleteConfirmTitle,
      labels.historyDeleteConfirmMessage,
      labels.historyDeleteConfirmAction,
      labels.historyDeleteCancelAction,
      historyActionListingId,
      markSellerHistoryFeatureRequestPending,
      removeSellerHistoryListing,
      labels.unavailableError,
    ],
  );

  return {
    layerStack,
    isLoggingOut,
    openSellerAccount,
    openSellerPostCar,
    openSellerHistory,
    warmSellerHistory,
    closeSellerListingFlow,
    accountScreenProps: {
      title: labels.accountTitle,
      subtitle: labels.accountSubtitle,
      sellerNameLabel: labels.sellerNameLabel,
      phoneLabel: labels.phoneLabel,
      sellerTypeLabel: labels.sellerTypeLabel,
      logoutLabel: labels.logoutLabel,
      sellerName: sellerProfile?.name ?? "",
      phone: sellerProfile?.phone ?? "",
      sellerType: sellerProfile
        ? formatCatalogEnumLabel(sellerProfile.sellerType)
        : "",
      backLabel: labels.backLabel,
      onBack: closeSellerListingFlow,
      onLogout: logoutSellerAccount,
    },
    historyScreenProps: {
      title: labels.historyTitle,
      subtitle: labels.historySubtitle,
      loadingLabel: labels.historyLoadingLabel,
      errorLabel: historyActionError ?? labels.historyErrorLabel,
      emptyLabel: labels.historyEmptyLabel,
      loadingMoreLabel: labels.historyLoadingMoreLabel,
      backLabel: labels.backLabel,
      statusMessage: historyStatusMessage,
      cards: historyCards,
      isLoading: sellerHistoryIsLoading,
      isLoadingMore: sellerHistoryIsLoadingMore,
      hasError: sellerHistoryHasError || Boolean(historyActionError),
      hasMore: sellerHistoryNextOffset !== null,
      onLoadMore: () => {
        void (async () => {
          try {
            const session = await ensureActiveSellerSession();
            await loadMoreSellerHistory({
              accessToken: session.accessToken,
              ownerPhone: session.phone,
            });
          } catch (error) {
            setHistoryActionError(
              error instanceof ApiRequestError
                ? error.message
                : labels.unavailableError,
            );
          }
        })();
      },
      onBack: closeSellerHistory,
    },
    postCarScreenProps: {
      title: editingListing ? labels.editScreenTitle : labels.postScreenTitle,
      subtitle: editingListing
        ? labels.editScreenSubtitle
        : labels.postScreenSubtitle,
      brandLabel: labels.brandLabel,
      modelLabel: labels.modelLabel,
      yearLabel: labels.yearLabel,
      priceLabel: labels.priceLabel,
      mileageLabel: labels.mileageLabel,
      rimSizeLabel: labels.rimSizeLabel,
      colorLabel: labels.colorLabel,
      descriptionLabel: labels.descriptionLabel,
      bodyTypeLabel: labels.bodyTypeLabel,
      conditionLabel: labels.conditionLabel,
      fuelTypeLabel: labels.fuelTypeLabel,
      transmissionLabel: labels.transmissionLabel,
      negotiableLabel: labels.negotiableLabel,
      accidentHistoryLabel: labels.accidentHistoryLabel,
      photosLabel: labels.photosLabel,
      addPhotosLabel: labels.addPhotosLabel,
      photosHelperLabel: labels.photosHelperLabel,
      removePhotoLabel: labels.removePhotoLabel,
      submitLabel: editingListing ? labels.editSubmitLabel : labels.submitLabel,
      backLabel: labels.backLabel,
      brandHelperLabel: labels.brandHelperLabel,
      modelHelperLabel: labels.modelHelperLabel,
      emptyModelsLabel: labels.emptyModelsLabel,
      brandValue: brandDraft,
      modelValue: modelDraft,
      isModelEnabled: Boolean(resolvedBrand),
      yearValue: yearDraft,
      priceValue: priceDraft,
      mileageValue: mileageDraft,
      rimSizeValue: rimSizeDraft,
      colorValue: colorDraft,
      descriptionValue: descriptionDraft,
      imageUris: draftImages.map((image) => image.uri),
      bodyTypeValue: bodyType,
      conditionValue: condition,
      fuelTypeValue: fuelType,
      transmissionValue: transmission,
      isNegotiableValue: isNegotiable,
      accidentHistoryValue: accidentHistory,
      brandSuggestions: visibleBrandSuggestions,
      modelSuggestions: visibleModelSuggestions,
      bodyTypeOptions,
      conditionOptions,
      fuelTypeOptions,
      transmissionOptions,
      yesNoOptions,
      isSubmitting,
      errorMessage: submitError,
      successMessage: undefined,
      onChangeBrand: (value: string) => {
        setBrandDraft(value);
        setModelDraft("");
        setBrandSelectedFromSuggestion(false);
        setModelSelectedFromSuggestion(false);
      },
      onChangeModel: (value: string) => {
        setModelDraft(value);
        setModelSelectedFromSuggestion(false);
      },
      onChangeYear: setYearDraft,
      onChangePrice: setPriceDraft,
      onChangeMileage: setMileageDraft,
      onChangeRimSize: setRimSizeDraft,
      onChangeColor: setColorDraft,
      onChangeDescription: setDescriptionDraft,
      onAddPhotos: () => {
        void pickSellerImages();
      },
      onRemovePhoto: (imageUri: string) => {
        setDraftImages((current) =>
          current.filter((image) => image.uri !== imageUri),
        );
      },
      onSelectBrand: (value: string) => {
        setBrandDraft(value);
        setModelDraft("");
        setBrandSelectedFromSuggestion(true);
        setModelSelectedFromSuggestion(false);
      },
      onSelectModel: (value: string) => {
        setModelDraft(value);
        setModelSelectedFromSuggestion(true);
      },
      onSelectBodyType: (value: string) => setBodyType(value as CarType),
      onSelectCondition: (value: string) =>
        setCondition(value as Condition),
      onSelectFuelType: (value: string) => setFuelType(value as FuelType),
      onSelectTransmission: (value: string) =>
        setTransmission(value as Transmission),
      onSelectNegotiable: (value: string) => setIsNegotiable(value as YesNo),
      onSelectAccidentHistory: (value: string) =>
        setAccidentHistory(value as YesNo),
      onSubmit: () => {
        void submitSellerListing();
      },
      onBack: closeSellerPost,
    },
  };
};
