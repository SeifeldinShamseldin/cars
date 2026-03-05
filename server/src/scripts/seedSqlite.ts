import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { buildSellerIdBase, normalizeEgyptianPhone } from "../admin/shared/phone";
import rawCarModels from "../data/car_models.json";
import { DEMO_CARS, type CarType, type DemoCar } from "../data/demoCars";

type RawCarModelRecord = {
  make_name?: unknown;
  optgroup_label?: unknown;
  model_label?: unknown;
};

type GeneratedSellListingSpec = {
  brand: string;
  model: string;
  type: string;
  sellerType: "OWNER" | "DEALER";
  condition: "NEW" | "USED";
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "PLUG_IN_HYBRID" | "ELECTRIC";
  transmission: "MANUAL" | "AUTOMATIC";
  color: string;
  year: number;
  priceValue: number;
  mileage: number;
  rimSizeInches: number;
  sellerName: string;
  telephone: string;
  postedAt: string;
  isNegotiable: "YES" | "NO";
  accidentHistory: "YES" | "NO";
};

const projectRoot = path.resolve(__dirname, "../..");
const sqliteDir = path.resolve(projectRoot, "sqlite");
const sqliteDbPath = path.resolve(sqliteDir, "dev.sqlite");
const sqliteSchemaPath = path.resolve(sqliteDir, "schema.sql");

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

const normalizeCarType = (value: string): CarType => {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("roadster") || normalized.includes("spyder") || normalized.includes("spider")) {
    return "ROADSTER";
  }
  if (normalized.includes("cabriolet") || normalized.includes("cabrio")) {
    return "CABRIOLET";
  }
  if (normalized.includes("convertible")) {
    return "CONVERTIBLE";
  }
  if (normalized.includes("hatch")) {
    return "HATCHBACK";
  }
  if (normalized.includes("crossover")) {
    return "CROSSOVER";
  }
  if (normalized.includes("suv")) {
    return "SUV";
  }
  if (normalized.includes("estate")) {
    return "ESTATE";
  }
  if (normalized.includes("wagon") || normalized.includes("touring") || normalized.includes("avant")) {
    return "WAGON";
  }
  if (normalized.includes("pickup") || normalized.includes("pick-up") || normalized.includes("truck")) {
    return "PICKUP";
  }
  if (normalized.includes("minivan") || normalized.includes("mpv")) {
    return "MINIVAN";
  }
  if (normalized.includes("van")) {
    return "VAN";
  }
  if (normalized.includes("sedan") || normalized.includes("saloon")) {
    return "SEDAN";
  }

  return "COUPE";
};

const buildStoredGalleryImageUrls = (car: DemoCar): string[] =>
  car.galleryImagePaths.length > 0
    ? car.galleryImagePaths
    : [car.imagePath ?? car.carImageUrl];

const buildPlaceholderGalleryImageUrls = (brand: string, model: string): string[] => {
  const encodedLabel = encodeURIComponent(`${brand} ${model}`);
  return [
    `https://placehold.co/1280x860?text=${encodedLabel}+Front`,
    `https://placehold.co/1280x860?text=${encodedLabel}+Rear`,
    `https://placehold.co/1280x860?text=${encodedLabel}+Interior`,
  ];
};

const openWritableDb = (): DatabaseSync => {
  if (existsSync(sqliteDbPath)) {
    rmSync(sqliteDbPath);
  }

  const schemaSql = readFileSync(sqliteSchemaPath, "utf8");
  const db = new DatabaseSync(sqliteDbPath);
  db.exec(schemaSql);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
};

const seedReferenceData = (db: DatabaseSync): void => {
  const insertBrand = db.prepare(`
    INSERT OR IGNORE INTO car_brands (id, name)
    VALUES (?, ?)
  `);
  const insertModel = db.prepare(`
    INSERT OR IGNORE INTO car_models (id, brand_id, name, group_label)
    VALUES (?, ?, ?, ?)
  `);

  for (const record of rawCarModels as RawCarModelRecord[]) {
    const brandName = normalizeText(record.make_name);
    const modelName = normalizeText(record.model_label);
    const groupLabel = normalizeText(record.optgroup_label);

    if (!brandName || !modelName) {
      continue;
    }

    const brandId = `brand_${slugify(brandName)}`;
    const modelId = `model_${slugify(brandName)}_${slugify(modelName)}`;

    insertBrand.run(brandId, brandName);
    insertModel.run(modelId, brandId, modelName, groupLabel);
  }
};

const ensureDemoBrandAndModel = (
  db: DatabaseSync,
  brandName: string,
  modelName: string,
): { brandId: string; modelId: string } => {
  const brandId = `brand_${slugify(brandName)}`;
  const modelId = `model_${slugify(brandName)}_${slugify(modelName)}`;

  db.prepare(`
    INSERT OR IGNORE INTO car_brands (id, name)
    VALUES (?, ?)
  `).run(brandId, brandName);

  db.prepare(`
    INSERT OR IGNORE INTO car_models (id, brand_id, name, group_label)
    VALUES (?, ?, ?, NULL)
  `).run(modelId, brandId, modelName);

  return { brandId, modelId };
};

const getExistingModelId = (
  db: DatabaseSync,
  brandName: string,
  modelName: string,
): string => {
  const row = db.prepare(`
    SELECT m.id
    FROM car_models m
    INNER JOIN car_brands b ON b.id = m.brand_id
    WHERE b.name = ? AND m.name = ?
  `).get(brandName, modelName) as { id: string } | undefined;

  if (!row) {
    throw new Error(`Missing reference model for seed listing: ${brandName} ${modelName}`);
  }

  return row.id;
};

const GENERATED_SELL_LISTINGS: GeneratedSellListingSpec[] = [
  { brand: "Mercedes-Benz", model: "A 200", type: "Hatchback", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2020, priceValue: 2450000, mileage: 42000, rimSizeInches: 18, sellerName: "Starline Motors", telephone: "+20 101 700 0101", postedAt: "2026-03-04T09:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "C 180", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2019, priceValue: 2890000, mileage: 58000, rimSizeInches: 18, sellerName: "Karim Adel", telephone: "+20 101 700 0102", postedAt: "2026-03-04T08:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "C 200", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Silver", year: 2021, priceValue: 3390000, mileage: 31000, rimSizeInches: 19, sellerName: "German House", telephone: "+20 101 700 0103", postedAt: "2026-03-04T07:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "E 200", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Blue", year: 2020, priceValue: 4050000, mileage: 36000, rimSizeInches: 19, sellerName: "Mostafa Nabil", telephone: "+20 101 700 0104", postedAt: "2026-03-04T06:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "E 300", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Graphite", year: 2022, priceValue: 4850000, mileage: 18000, rimSizeInches: 20, sellerName: "Stuttgart Gallery", telephone: "+20 101 700 0105", postedAt: "2026-03-04T05:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "GLA 200", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Red", year: 2021, priceValue: 3180000, mileage: 29000, rimSizeInches: 19, sellerName: "Youssef Hatem", telephone: "+20 101 700 0106", postedAt: "2026-03-04T04:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "GLC 300", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2022, priceValue: 5250000, mileage: 21000, rimSizeInches: 20, sellerName: "Auto Axis", telephone: "+20 101 700 0107", postedAt: "2026-03-04T03:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "GLE 450", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2023, priceValue: 7450000, mileage: 12000, rimSizeInches: 21, sellerName: "Silver Star EG", telephone: "+20 101 700 0108", postedAt: "2026-03-04T02:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "S 500", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Obsidian", year: 2022, priceValue: 8900000, mileage: 15000, rimSizeInches: 20, sellerName: "Hassan Refaat", telephone: "+20 101 700 0109", postedAt: "2026-03-04T01:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "BMW", model: "320", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2018, priceValue: 2140000, mileage: 67000, rimSizeInches: 18, sellerName: "Ahmed Salah", telephone: "+20 101 700 0110", postedAt: "2026-03-03T23:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "BMW", model: "330", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Blue", year: 2021, priceValue: 3280000, mileage: 34000, rimSizeInches: 19, sellerName: "Bavaria Select", telephone: "+20 101 700 0111", postedAt: "2026-03-03T22:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "BMW", model: "520", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Silver", year: 2019, priceValue: 3150000, mileage: 52000, rimSizeInches: 18, sellerName: "Sherif Amin", telephone: "+20 101 700 0112", postedAt: "2026-03-03T21:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "BMW", model: "530", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Black", year: 2022, priceValue: 4380000, mileage: 22000, rimSizeInches: 19, sellerName: "Munich Hub", telephone: "+20 101 700 0113", postedAt: "2026-03-03T20:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "BMW", model: "740", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2020, priceValue: 5990000, mileage: 28000, rimSizeInches: 20, sellerName: "Tamer Wagdy", telephone: "+20 101 700 0114", postedAt: "2026-03-03T19:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "BMW", model: "X3", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Dark Blue", year: 2021, priceValue: 3890000, mileage: 30000, rimSizeInches: 19, sellerName: "Drive District", telephone: "+20 101 700 0115", postedAt: "2026-03-03T18:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "BMW", model: "X5", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2023, priceValue: 6950000, mileage: 14000, rimSizeInches: 21, sellerName: "Prime Motion", telephone: "+20 101 700 0116", postedAt: "2026-03-03T17:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "BMW", model: "M3", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Green", year: 2022, priceValue: 7150000, mileage: 17000, rimSizeInches: 20, sellerName: "Marwan Hany", telephone: "+20 101 700 0117", postedAt: "2026-03-03T16:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "BMW", model: "M5", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2021, priceValue: 8350000, mileage: 21000, rimSizeInches: 20, sellerName: "Track & Street", telephone: "+20 101 700 0118", postedAt: "2026-03-03T15:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Toyota", model: "Corolla", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2022, priceValue: 1420000, mileage: 26000, rimSizeInches: 17, sellerName: "Ali Samir", telephone: "+20 101 700 0119", postedAt: "2026-03-03T14:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Toyota", model: "Camry", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Black", year: 2023, priceValue: 2190000, mileage: 16000, rimSizeInches: 18, sellerName: "Nile Cars", telephone: "+20 101 700 0120", postedAt: "2026-03-03T13:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Toyota", model: "Land Cruiser", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Beige", year: 2021, priceValue: 5050000, mileage: 33000, rimSizeInches: 20, sellerName: "Mahmoud Ragab", telephone: "+20 101 700 0121", postedAt: "2026-03-03T12:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Toyota", model: "Corolla Cross", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Silver", year: 2023, priceValue: 1950000, mileage: 14000, rimSizeInches: 18, sellerName: "Metro Auto", telephone: "+20 101 700 0122", postedAt: "2026-03-03T11:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Toyota", model: "Yaris", type: "Hatchback", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Red", year: 2020, priceValue: 980000, mileage: 49000, rimSizeInches: 16, sellerName: "Nour Fawzy", telephone: "+20 101 700 0123", postedAt: "2026-03-03T10:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Toyota", model: "Hilux", type: "Pickup", sellerType: "DEALER", condition: "USED", fuelType: "DIESEL", transmission: "AUTOMATIC", color: "White", year: 2022, priceValue: 2390000, mileage: 28000, rimSizeInches: 18, sellerName: "Delta Trucks", telephone: "+20 101 700 0124", postedAt: "2026-03-03T09:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Toyota", model: "C-HR", type: "Crossover", sellerType: "OWNER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Grey", year: 2021, priceValue: 1640000, mileage: 35000, rimSizeInches: 18, sellerName: "Dina Ayman", telephone: "+20 101 700 0125", postedAt: "2026-03-03T08:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Toyota", model: "Fortuner", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2020, priceValue: 3650000, mileage: 47000, rimSizeInches: 19, sellerName: "4x4 Center", telephone: "+20 101 700 0126", postedAt: "2026-03-03T07:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Audi", model: "A3", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2020, priceValue: 1840000, mileage: 41000, rimSizeInches: 17, sellerName: "Sameh Adel", telephone: "+20 101 700 0127", postedAt: "2026-03-03T06:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Audi", model: "A4", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2021, priceValue: 2780000, mileage: 32000, rimSizeInches: 18, sellerName: "Quattro Hub", telephone: "+20 101 700 0128", postedAt: "2026-03-03T05:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Audi", model: "A5", type: "Coupe", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Blue", year: 2022, priceValue: 3560000, mileage: 21000, rimSizeInches: 19, sellerName: "Ola Fikry", telephone: "+20 101 700 0129", postedAt: "2026-03-03T04:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Audi", model: "A6", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Black", year: 2023, priceValue: 4690000, mileage: 17000, rimSizeInches: 19, sellerName: "Auto Lounge", telephone: "+20 101 700 0130", postedAt: "2026-03-03T03:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Audi", model: "A8", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2021, priceValue: 6490000, mileage: 24000, rimSizeInches: 20, sellerName: "Walid Taher", telephone: "+20 101 700 0131", postedAt: "2026-03-03T02:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Audi", model: "Q3", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Orange", year: 2022, priceValue: 3120000, mileage: 25000, rimSizeInches: 19, sellerName: "Urban Drive", telephone: "+20 101 700 0132", postedAt: "2026-03-03T01:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Audi", model: "Q5", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2021, priceValue: 3980000, mileage: 30000, rimSizeInches: 20, sellerName: "Mina Yasser", telephone: "+20 101 700 0133", postedAt: "2026-03-03T00:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Audi", model: "Q7", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2023, priceValue: 6150000, mileage: 14000, rimSizeInches: 21, sellerName: "Lux Motor House", telephone: "+20 101 700 0134", postedAt: "2026-03-02T23:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Audi", model: "TT", type: "Coupe", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Red", year: 2020, priceValue: 3290000, mileage: 29000, rimSizeInches: 19, sellerName: "Ramy Magdy", telephone: "+20 101 700 0135", postedAt: "2026-03-02T22:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Porsche", model: "911", type: "Coupe", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Yellow", year: 2022, priceValue: 10200000, mileage: 13000, rimSizeInches: 20, sellerName: "Nine Eleven House", telephone: "+20 101 700 0136", postedAt: "2026-03-02T21:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Porsche", model: "Cayenne", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Black", year: 2023, priceValue: 8450000, mileage: 15000, rimSizeInches: 21, sellerName: "Hossam Zaki", telephone: "+20 101 700 0137", postedAt: "2026-03-02T20:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Porsche", model: "Macan", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2022, priceValue: 6290000, mileage: 19000, rimSizeInches: 20, sellerName: "P Crest", telephone: "+20 101 700 0138", postedAt: "2026-03-02T19:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Porsche", model: "Panamera", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Blue", year: 2021, priceValue: 7350000, mileage: 26000, rimSizeInches: 20, sellerName: "Khaled Saeed", telephone: "+20 101 700 0139", postedAt: "2026-03-02T18:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Porsche", model: "Boxster", type: "Roadster", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Silver", year: 2020, priceValue: 5580000, mileage: 29000, rimSizeInches: 20, sellerName: "Nader Shawky", telephone: "+20 101 700 0140", postedAt: "2026-03-02T17:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Porsche", model: "Cayman", type: "Coupe", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2021, priceValue: 5890000, mileage: 22000, rimSizeInches: 20, sellerName: "Sportline Garage", telephone: "+20 101 700 0141", postedAt: "2026-03-02T16:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Porsche", model: "Taycan", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "ELECTRIC", transmission: "AUTOMATIC", color: "White", year: 2024, priceValue: 7790000, mileage: 9000, rimSizeInches: 21, sellerName: "Electric Elite", telephone: "+20 101 700 0142", postedAt: "2026-03-02T15:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Dodge", model: "Challenger", type: "Coupe", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Plum Crazy", year: 2020, priceValue: 3690000, mileage: 33000, rimSizeInches: 20, sellerName: "Omar Maged", telephone: "+20 101 700 0143", postedAt: "2026-03-02T14:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Dodge", model: "Charger", type: "Sedan", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Black", year: 2021, priceValue: 3990000, mileage: 28000, rimSizeInches: 20, sellerName: "Muscle Yard", telephone: "+20 101 700 0144", postedAt: "2026-03-02T13:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Dodge", model: "Durango", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2022, priceValue: 4250000, mileage: 24000, rimSizeInches: 20, sellerName: "Hany Adel", telephone: "+20 101 700 0145", postedAt: "2026-03-02T12:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Dodge", model: "RAM", type: "Pickup", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "White", year: 2023, priceValue: 4590000, mileage: 18000, rimSizeInches: 20, sellerName: "Truck Nation", telephone: "+20 101 700 0146", postedAt: "2026-03-02T11:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Dodge", model: "Viper", type: "Coupe", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "MANUAL", color: "Red", year: 2017, priceValue: 6950000, mileage: 21000, rimSizeInches: 19, sellerName: "Aly Samy", telephone: "+20 101 700 0147", postedAt: "2026-03-02T10:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Dodge", model: "Hornet", type: "Crossover", sellerType: "DEALER", condition: "USED", fuelType: "HYBRID", transmission: "AUTOMATIC", color: "Blue", year: 2024, priceValue: 2550000, mileage: 8000, rimSizeInches: 18, sellerName: "City Drive", telephone: "+20 101 700 0148", postedAt: "2026-03-02T09:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Mercedes-Benz", model: "A 250", type: "Hatchback", sellerType: "DEALER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Silver", year: 2023, priceValue: 2820000, mileage: 16000, rimSizeInches: 18, sellerName: "Compact Hub", telephone: "+20 101 700 0149", postedAt: "2026-03-02T08:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "BMW", model: "X5", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "DIESEL", transmission: "AUTOMATIC", color: "White", year: 2020, priceValue: 5520000, mileage: 42000, rimSizeInches: 20, sellerName: "Fady Naguib", telephone: "+20 101 700 0150", postedAt: "2026-03-02T07:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Toyota", model: "Camry", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Brown", year: 2021, priceValue: 1860000, mileage: 39000, rimSizeInches: 17, sellerName: "Rana Hosny", telephone: "+20 101 700 0151", postedAt: "2026-03-02T06:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Audi", model: "Q5", type: "SUV", sellerType: "DEALER", condition: "USED", fuelType: "DIESEL", transmission: "AUTOMATIC", color: "Navy", year: 2022, priceValue: 4220000, mileage: 26000, rimSizeInches: 20, sellerName: "Ring Motors", telephone: "+20 101 700 0152", postedAt: "2026-03-02T05:00:00.000Z", isNegotiable: "NO", accidentHistory: "NO" },
  { brand: "Porsche", model: "Macan", type: "SUV", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Crayon", year: 2021, priceValue: 5920000, mileage: 30000, rimSizeInches: 20, sellerName: "Bishoy Nader", telephone: "+20 101 700 0153", postedAt: "2026-03-02T04:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
  { brand: "Dodge", model: "Charger", type: "Sedan", sellerType: "OWNER", condition: "USED", fuelType: "PETROL", transmission: "AUTOMATIC", color: "Grey", year: 2019, priceValue: 3320000, mileage: 51000, rimSizeInches: 19, sellerName: "Moez Fathy", telephone: "+20 101 700 0154", postedAt: "2026-03-02T03:00:00.000Z", isNegotiable: "YES", accidentHistory: "NO" },
];

const seedSellListings = (db: DatabaseSync): void => {
  const insertSeller = db.prepare(`
    INSERT OR IGNORE INTO sellers (id, name, phone, seller_type)
    VALUES (?, ?, ?, ?)
  `);
  const insertListing = db.prepare(`
    INSERT INTO car_listings (
      id,
      seller_id,
      model_id,
      status,
      is_featured,
      featured_position,
      featured_request_status,
      body_type,
      year,
      price_value,
      condition,
      fuel_type,
      transmission,
      mileage,
      rim_size_inches,
      color,
      is_negotiable,
      accident_history,
      description,
      posted_at,
      gallery_image_urls
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  DEMO_CARS.filter((entry) => entry.category === "SELL").forEach((car, index) => {
    const { modelId } = ensureDemoBrandAndModel(db, car.brand, car.model);
    const sellerName = car.sellerName ?? `${car.brand} seller`;
    const sellerPhone = normalizeEgyptianPhone(car.telephone ?? "+20 100 000 0000");
    const sellerId = buildSellerIdBase(sellerName, sellerPhone);

    insertSeller.run(
      sellerId,
      sellerName,
      sellerPhone,
      car.sellerType ?? "OWNER",
    );

    insertListing.run(
      `listing_${car.id}`,
      sellerId,
      modelId,
      "APPROVED",
      index < 5 ? "YES" : "NO",
      index < 5 ? index + 1 : null,
      index < 5 ? "APPROVED" : "NONE",
      normalizeCarType(car.type),
      car.year,
      car.priceValue ?? 0,
      car.condition ?? "USED",
      car.fuelType ?? "PETROL",
      car.transmission ?? "AUTOMATIC",
      car.mileage ?? 0,
      car.rimSizeInches ?? 18,
      car.color ?? "Unknown",
      car.isNegotiable ?? "NO",
      car.accidentHistory ?? "NO",
      car.description,
      car.postedAt ?? new Date().toISOString(),
      JSON.stringify(buildStoredGalleryImageUrls(car)),
    );
  });

  GENERATED_SELL_LISTINGS.forEach((listing, index) => {
    const modelId = getExistingModelId(db, listing.brand, listing.model);
    const sellerPhone = normalizeEgyptianPhone(listing.telephone);
    const sellerId = buildSellerIdBase(listing.sellerName, sellerPhone);

    insertSeller.run(
      sellerId,
      listing.sellerName,
      sellerPhone,
      listing.sellerType,
    );

    insertListing.run(
      `listing_seed_${slugify(listing.brand)}_${slugify(listing.model)}_${index + 1}`,
      sellerId,
      modelId,
      "APPROVED",
      "NO",
      null,
      "NONE",
      normalizeCarType(listing.type),
      listing.year,
      listing.priceValue,
      listing.condition,
      listing.fuelType,
      listing.transmission,
      listing.mileage,
      listing.rimSizeInches,
      listing.color,
      listing.isNegotiable,
      listing.accidentHistory,
      `${listing.brand} ${listing.model} in clean condition with verified details and fresh catalog seed data.`,
      listing.postedAt,
      JSON.stringify(buildPlaceholderGalleryImageUrls(listing.brand, listing.model)),
    );
  });
};

const seedUpdates = (db: DatabaseSync): void => {
  const insertUpdate = db.prepare(`
    INSERT INTO car_updates (
      id,
      status,
      is_featured,
      featured_position,
      featured_request_status,
      brand,
      model,
      body_type,
      year,
      description,
      posted_at,
      gallery_image_urls
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  DEMO_CARS.filter((entry) => entry.category === "UPDATE").forEach((car, index) => {
    insertUpdate.run(
      `update_${car.id}`,
      "VISIBLE",
      index < 5 ? "YES" : "NO",
      index < 5 ? index + 1 : null,
      index < 5 ? "APPROVED" : "NONE",
      car.brand,
      car.model,
      normalizeCarType(car.type),
      car.year,
      car.description,
      car.postedAt ?? new Date().toISOString(),
      JSON.stringify(buildStoredGalleryImageUrls(car)),
    );
  });
};

const main = (): void => {
  const db = openWritableDb();

  seedReferenceData(db);
  seedSellListings(db);
  seedUpdates(db);

  const counts = {
    brands: Number((db.prepare("SELECT COUNT(*) AS count FROM car_brands").get() as { count: number }).count),
    models: Number((db.prepare("SELECT COUNT(*) AS count FROM car_models").get() as { count: number }).count),
    sellers: Number((db.prepare("SELECT COUNT(*) AS count FROM sellers").get() as { count: number }).count),
    listings: Number((db.prepare("SELECT COUNT(*) AS count FROM car_listings").get() as { count: number }).count),
    updates: Number((db.prepare("SELECT COUNT(*) AS count FROM car_updates").get() as { count: number }).count),
  };

  console.log(JSON.stringify({ sqliteDbPath, ...counts }, null, 2));
};

main();
