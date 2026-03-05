import { DEMO_CARS } from "../../data/demoCars";
import { getReadOnlySqliteDb } from "../../data/sqliteDb";

const protectedCatalogAssetPaths = new Set(
  DEMO_CARS.flatMap((car) => [
    ...(car.imagePath ? [car.imagePath] : []),
    ...car.galleryImagePaths,
  ]),
);

const countCatalogAssetReferences = (imagePath: string): number => {
  const db = getReadOnlySqliteDb();
  const updateCount = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_updates, json_each(car_updates.gallery_image_urls)
        WHERE json_each.value = ?
      `).get(imagePath) as { total: number }
    ).total,
  );
  const listingCount = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS total
        FROM car_listings, json_each(car_listings.gallery_image_urls)
        WHERE json_each.value = ?
      `).get(imagePath) as { total: number }
    ).total,
  );

  return updateCount + listingCount;
};

export const getDeletableCatalogImagePaths = (
  imagePaths: string[],
): string[] =>
  imagePaths.filter((imagePath) => {
    if (!imagePath.startsWith("/assets/catalog/")) {
      return false;
    }

    if (protectedCatalogAssetPaths.has(imagePath)) {
      return false;
    }

    return countCatalogAssetReferences(imagePath) === 0;
  });
