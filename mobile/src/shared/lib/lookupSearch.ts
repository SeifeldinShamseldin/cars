export const normalizeLookupText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const normalizeLookupCompact = (value: string): string =>
  normalizeLookupText(value).replace(/\s+/g, "");

export const matchesLookupQuery = (value: string, query: string) => {
  const normalizedValue = normalizeLookupText(value);
  const normalizedQuery = normalizeLookupText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (normalizedValue === normalizedQuery || normalizedValue.startsWith(normalizedQuery)) {
    return true;
  }

  return normalizedValue.split(" ").some((token) => token.startsWith(normalizedQuery));
};

const getLookupMatchRank = (value: string, query: string): number | null => {
  const normalizedValue = normalizeLookupText(value);
  const normalizedQuery = normalizeLookupText(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return 0;
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedValue.split(" ").some((token) => token.startsWith(normalizedQuery))) {
    return 2;
  }

  return null;
};

export const rankLookupSuggestions = (values: string[], query: string): string[] => {
  const normalizedQuery = normalizeLookupText(query);

  if (!normalizedQuery) {
    return values;
  }

  return values
    .map((value) => ({
      value,
      rank: getLookupMatchRank(value, normalizedQuery),
      normalizedValue: normalizeLookupText(value),
    }))
    .filter(
      (
        item,
      ): item is {
        value: string;
        rank: number;
        normalizedValue: string;
      } => item.rank !== null,
    )
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      if (left.normalizedValue.length !== right.normalizedValue.length) {
        return left.normalizedValue.length - right.normalizedValue.length;
      }

      const numericLeft = Number.parseInt(left.normalizedValue.replace(/[^0-9]/g, ""), 10);
      const numericRight = Number.parseInt(right.normalizedValue.replace(/[^0-9]/g, ""), 10);
      const hasNumericLeft = Number.isFinite(numericLeft);
      const hasNumericRight = Number.isFinite(numericRight);

      if (hasNumericLeft && hasNumericRight && numericLeft !== numericRight) {
        return numericLeft - numericRight;
      }

      return left.normalizedValue.localeCompare(right.normalizedValue);
    })
    .map((item) => item.value);
};
