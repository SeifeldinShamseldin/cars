import { Image, type ImageSource } from "expo-image";

const getRemoteImageUri = (source: ImageSource | string): string | null => {
  if (typeof source === "string") {
    return source.startsWith("http://") || source.startsWith("https://")
      ? source
      : null;
  }

  if (source && typeof source === "object" && "uri" in source) {
    return typeof source.uri === "string" &&
      (source.uri.startsWith("http://") || source.uri.startsWith("https://"))
      ? source.uri
      : null;
  }

  return null;
};

export const prefetchRemoteImages = async (
  sources: Array<ImageSource | string>,
): Promise<boolean> => {
  const urls = Array.from(
    new Set(
      sources
        .map(getRemoteImageUri)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (urls.length === 0) {
    return true;
  }

  return Image.prefetch(urls, "memory-disk");
};
