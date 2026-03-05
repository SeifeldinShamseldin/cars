export const formatCatalogEnumLabel = (value: string): string =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatCatalogPrice = (priceValue: number): string =>
  `EGP ${priceValue.toLocaleString()}`;

export const formatCatalogDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
): string => new Date(value).toLocaleDateString("en-US", options);

