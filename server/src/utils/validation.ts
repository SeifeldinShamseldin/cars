const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isNonEmptyString = (
  value: unknown,
  options?: { maxLength?: number },
): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    return false;
  }

  return true;
};

export const asTrimmedString = (value: unknown): string | undefined => {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  return value.trim();
};

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const hasStringField = (
  value: unknown,
  field: string,
  options?: { maxLength?: number },
): boolean => isObject(value) && isNonEmptyString(value[field], options);

export const hasNumberField = (value: unknown, field: string): boolean =>
  isObject(value) && isFiniteNumber(value[field]);

export const isRecord = isObject;

