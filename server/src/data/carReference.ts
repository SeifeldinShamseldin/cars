import rawCarModels from "./car_models.json";

type RawCarModelRecord = {
  make_name?: unknown;
  optgroup_label?: unknown;
  model_label?: unknown;
};

export type CarReferenceModelGroupDto = {
  groupLabel: string | null;
  models: string[];
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const rawRecords = (rawCarModels as RawCarModelRecord[])
  .map((record) => ({
    makeName: normalizeText(record.make_name),
    groupLabel: normalizeText(record.optgroup_label),
    modelLabel: normalizeText(record.model_label),
  }))
  .filter(
    (
      record,
    ): record is {
      makeName: string;
      groupLabel: string | null;
      modelLabel: string;
    } => Boolean(record.makeName && record.modelLabel),
  );

const brands = [...new Set(rawRecords.map((record) => record.makeName))].sort((left, right) =>
  left.localeCompare(right),
);

const modelGroupsByBrand = new Map<string, CarReferenceModelGroupDto[]>(
  brands.map((brand) => {
    const groupedModels = new Map<string, Set<string>>();

    rawRecords
      .filter((record) => record.makeName === brand)
      .forEach((record) => {
        const groupKey = record.groupLabel ?? "";
        const models = groupedModels.get(groupKey) ?? new Set<string>();
        models.add(record.modelLabel);
        groupedModels.set(groupKey, models);
      });

    const groups = [...groupedModels.entries()]
      .map(([groupKey, models]) => ({
        groupLabel: groupKey.length > 0 ? groupKey : null,
        models: [...models].sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => {
        if (left.groupLabel === null) {
          return 1;
        }

        if (right.groupLabel === null) {
          return -1;
        }

        return left.groupLabel.localeCompare(right.groupLabel);
      });

    return [brand.toLowerCase(), groups];
  }),
);

export const getCarReferenceBrands = (): string[] => brands;

export const getCarReferenceModelGroups = (brand: string): CarReferenceModelGroupDto[] => {
  const normalizedBrand = brand.trim().toLowerCase();

  if (normalizedBrand.length === 0) {
    return [];
  }

  return modelGroupsByBrand.get(normalizedBrand) ?? [];
};
