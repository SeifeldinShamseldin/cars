import type { CarReferenceModelGroup } from "../api/catalog";
import type { CatalogSearchOverlayViewModel } from "../../features/catalog/components/CarsCatalogFeed";
import { matchesLookupQuery } from "./lookupSearch";
import {
  AVAILABLE_CAR_TYPES,
  AVAILABLE_CONDITIONS,
  AVAILABLE_FUEL_TYPES,
  AVAILABLE_TRANSMISSIONS,
  type SearchFilters,
} from "./catalogFilters";

type BuildCatalogSearchOverlayParams = {
  enabled: boolean;
  quickSearchTitle: string;
  searchPlaceholder: string;
  draftFilters: SearchFilters;
  appliedFilters: SearchFilters;
  brandLabel: string;
  modelLabel: string;
  carTypeLabel: string;
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  yearFilterLabel: string;
  yearFromLabel: string;
  yearToLabel: string;
  mileageLabel: string;
  mileageFromLabel: string;
  mileageToLabel: string;
  conditionLabel: string;
  transmissionLabel: string;
  fuelTypeLabel: string;
  clearAllLabel: string;
  offersLabel: string;
  chooseBrandFirstLabel: string;
  noModelsLabel: string;
  resultCount: number;
  availableBrands: string[];
  availableModelGroups: CarReferenceModelGroup[];
  availablePrices: number[];
  availableYears: number[];
  setDraftFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setAppliedFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const getAvailableModelNames = (groups: CarReferenceModelGroup[]): string[] =>
  groups.flatMap((group) => group.models);

const shouldClearConflictingLookupQuery = ({
  query,
  selectedBrand,
  selectedModels,
  availableBrands,
  availableModelNames,
}: {
  query: string;
  selectedBrand?: string;
  selectedModels: string[];
  availableBrands: string[];
  availableModelNames: string[];
}): boolean => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return false;
  }

  const matchesSelectedBrand = selectedBrand
    ? matchesLookupQuery(selectedBrand, trimmedQuery)
    : false;
  const matchesSelectedModel = selectedModels.some((model) =>
    matchesLookupQuery(model, trimmedQuery),
  );
  const matchesAvailableModel = availableModelNames.some((model) =>
    matchesLookupQuery(model, trimmedQuery),
  );

  if (matchesSelectedBrand || matchesSelectedModel || matchesAvailableModel) {
    return false;
  }

  const matchesAnyBrand = availableBrands.some((brand) =>
    matchesLookupQuery(brand, trimmedQuery),
  );
  const matchesAnyModel = availableModelNames.some((model) =>
    matchesLookupQuery(model, trimmedQuery),
  );

  return matchesAnyBrand || matchesAnyModel;
};

export const buildCatalogSearchOverlayProps = ({
  enabled,
  quickSearchTitle,
  searchPlaceholder,
  draftFilters,
  appliedFilters,
  brandLabel,
  modelLabel,
  carTypeLabel,
  priceLabel,
  priceFromLabel,
  priceToLabel,
  yearFilterLabel,
  yearFromLabel,
  yearToLabel,
  mileageLabel,
  mileageFromLabel,
  mileageToLabel,
  conditionLabel,
  transmissionLabel,
  fuelTypeLabel,
  clearAllLabel,
  offersLabel,
  chooseBrandFirstLabel,
  noModelsLabel,
  resultCount,
  availableBrands,
  availableModelGroups,
  availablePrices,
  availableYears,
  setDraftFilters,
  setAppliedFilters,
  setIsSearchOpen,
}: BuildCatalogSearchOverlayParams): CatalogSearchOverlayViewModel | undefined => {
  if (!enabled) {
    return undefined;
  }

  return {
    visible: false,
    title: quickSearchTitle,
    searchPlaceholder,
    searchValue: draftFilters.query,
    brandLabel,
    modelLabel,
    carTypeLabel,
    priceLabel,
    priceFromLabel,
    priceToLabel,
    yearLabel: yearFilterLabel,
    yearFromLabel,
    yearToLabel,
    mileageLabel,
    mileageFromLabel,
    mileageToLabel,
    conditionLabel,
    transmissionLabel,
    fuelTypeLabel,
    clearAllLabel,
    offersLabel,
    selectedBrand: draftFilters.brand,
    selectedModels: draftFilters.model ?? [],
    selectedCarType: draftFilters.carType,
    selectedPriceFrom: draftFilters.priceFrom,
    selectedPriceTo: draftFilters.priceTo,
    selectedYearFrom: draftFilters.yearFrom,
    selectedYearTo: draftFilters.yearTo,
    selectedMileageFrom: draftFilters.mileageFrom,
    selectedMileageTo: draftFilters.mileageTo,
    selectedCondition: draftFilters.condition,
    selectedTransmission: draftFilters.transmission,
    selectedFuelType: draftFilters.fuelType,
    availableBrands,
    availableModelGroups,
    availableCarTypes: AVAILABLE_CAR_TYPES,
    availablePrices,
    availableYears,
    availableConditions: AVAILABLE_CONDITIONS,
    availableTransmissions: AVAILABLE_TRANSMISSIONS,
    availableFuelTypes: AVAILABLE_FUEL_TYPES,
    chooseBrandFirstLabel,
    noModelsLabel,
    resultCount,
    onBack: () => {
      setDraftFilters(appliedFilters);
      setIsSearchOpen(false);
    },
    onChangeSearch: (value) =>
      setDraftFilters((current) => ({
        ...current,
        query: value,
      })),
    onClearAll: () => setDraftFilters({ query: "" }),
    onClearSearch: () =>
      setDraftFilters((current) => ({
        ...current,
        query: "",
      })),
    onSelectBrand: (brand) =>
      setDraftFilters((current) => {
        const brandChanged = current.brand !== brand;
        const nextModels = (brandChanged ? [] : current.model) ?? [];
        const currentModelNames = getAvailableModelNames(availableModelGroups);
        const queryConflicts = shouldClearConflictingLookupQuery({
          query: current.query,
          selectedBrand: brand,
          selectedModels: nextModels,
          availableBrands,
          availableModelNames: brandChanged ? [] : currentModelNames,
        });

        return {
          ...current,
          brand,
          model: nextModels,
          query: queryConflicts ? "" : current.query,
        };
      }),
    onToggleModel: (model) =>
      setDraftFilters((current) => {
        const currentModels = current.model ?? [];
        const hasModel = currentModels.includes(model);
        const nextModels = hasModel
          ? currentModels.filter((item) => item !== model)
          : [...currentModels, model];
        const queryConflicts = shouldClearConflictingLookupQuery({
          query: current.query,
          selectedBrand: current.brand,
          selectedModels: nextModels,
          availableBrands,
          availableModelNames: getAvailableModelNames(availableModelGroups),
        });

        return {
          ...current,
          model: nextModels,
          query: queryConflicts ? "" : current.query,
        };
      }),
    onSelectCarType: (carType) => setDraftFilters((current) => ({ ...current, carType })),
    onSelectPriceFrom: (priceFrom) =>
      setDraftFilters((current) => ({
        ...current,
        priceFrom,
        priceTo:
          current.priceTo !== undefined &&
          priceFrom !== undefined &&
          current.priceTo < priceFrom
            ? undefined
            : current.priceTo,
      })),
    onSelectPriceTo: (priceTo) =>
      setDraftFilters((current) => ({
        ...current,
        priceTo,
        priceFrom:
          current.priceFrom !== undefined &&
          priceTo !== undefined &&
          current.priceFrom > priceTo
            ? undefined
            : current.priceFrom,
      })),
    onSelectYearFrom: (yearFrom) =>
      setDraftFilters((current) => ({
        ...current,
        yearFrom,
        yearTo:
          current.yearTo && yearFrom && current.yearTo < yearFrom ? undefined : current.yearTo,
      })),
    onSelectYearTo: (yearTo) =>
      setDraftFilters((current) => ({
        ...current,
        yearTo,
        yearFrom:
          current.yearFrom && yearTo && current.yearFrom > yearTo ? undefined : current.yearFrom,
      })),
    onSelectMileageFrom: (mileageFrom) =>
      setDraftFilters((current) => ({
        ...current,
        mileageFrom,
        mileageTo:
          current.mileageTo !== undefined &&
          mileageFrom !== undefined &&
          current.mileageTo < mileageFrom
            ? undefined
            : current.mileageTo,
      })),
    onSelectMileageTo: (mileageTo) =>
      setDraftFilters((current) => ({
        ...current,
        mileageTo,
        mileageFrom:
          current.mileageFrom !== undefined &&
          mileageTo !== undefined &&
          current.mileageFrom > mileageTo
            ? undefined
            : current.mileageFrom,
      })),
    onSelectCondition: (condition) => setDraftFilters((current) => ({ ...current, condition })),
    onSelectTransmission: (transmission) =>
      setDraftFilters((current) => ({ ...current, transmission })),
    onSelectFuelType: (fuelType) => setDraftFilters((current) => ({ ...current, fuelType })),
    onApply: () => {
      setAppliedFilters(draftFilters);
      setIsSearchOpen(false);
    },
  };
};
