const getDigits = (value: string): string => value.replace(/\D/g, "");

const getEgyptianNationalMobileDigits = (value: string): string | null => {
  const digits = getDigits(value);

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("20")) {
    return `0${digits.slice(2)}`;
  }

  if (digits.length === 10 && digits.startsWith("1")) {
    return `0${digits}`;
  }

  return null;
};

export const normalizeEgyptianPhone = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const nationalDigits = getEgyptianNationalMobileDigits(trimmed);
  if (!nationalDigits) {
    return trimmed;
  }

  const carrier = nationalDigits.slice(1, 4);
  const middle = nationalDigits.slice(4, 7);
  const last = nationalDigits.slice(7, 11);

  return `+20 ${carrier} ${middle} ${last}`;
};

export const getNormalizedPhoneDigits = (value: string): string => {
  const nationalDigits = getEgyptianNationalMobileDigits(value);
  if (!nationalDigits) {
    return getDigits(value);
  }

  return `20${nationalDigits.slice(1)}`;
};

const normalizeNameForId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 48);

export const getFormattedPhoneForSellerId = (value: string): string => {
  const nationalDigits = getEgyptianNationalMobileDigits(value);
  if (!nationalDigits) {
    return getDigits(value);
  }

  const carrier = nationalDigits.slice(1, 4);
  const middle = nationalDigits.slice(4, 7);
  const last = nationalDigits.slice(7, 11);

  return `20_${carrier}_${middle}_${last}`;
};

export const buildSellerIdBase = (name: string, phone: string): string => {
  const namePart = normalizeNameForId(name) || "seller";
  const phonePart = getFormattedPhoneForSellerId(phone);

  return phonePart.length > 0
    ? `seller_${namePart}_${phonePart}`
    : `seller_${namePart}`;
};
