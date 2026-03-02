import type { GuessCarClue } from "../../shared/types/domain";

export type CarCategory = "SELL" | "UPDATE";

export type DemoCar = {
  id: string;
  category: CarCategory;
  label: string;
  brand: string;
  model: string;
  type: string;
  year: number;
  topSpeedKmh: number;
  torqueNm: number;
  description: string;
  carImageUrl: string;
  imagePath?: string;
  galleryImagePaths: string[];
  partImageUrl: string;
  clue: GuessCarClue;
  priceValue?: number;
  priceLabel?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  trim?: string;
  color?: string;
  mileage?: number;
  hp?: number;
  engineLabel?: string;
};

export type CatalogCarSummaryDto = {
  id: string;
  category: CarCategory;
  brand: string;
  model: string;
  type: string;
  year: number;
  topSpeedKmh: number;
  torqueNm: number;
  imageUrl: string;
  description: string;
  priceValue?: number;
  priceLabel?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  trim?: string;
  color?: string;
  mileage?: number;
};

export type CatalogCarDetailDto = CatalogCarSummaryDto & {
  galleryImageUrls: string[];
  condition?: string;
  fuelType?: string;
  transmission?: string;
  trim?: string;
  color?: string;
  mileage?: number;
  hp?: number;
  engineLabel?: string;
};

const buildPlaceholderImage = (label: string, suffix: string): string =>
  `https://placehold.co/960x640?text=${encodeURIComponent(`${label} ${suffix}`)}`;

const buildAssetPath = (fileName: string): string => `/assets/catalog/${fileName}`;

type BuildCarDetails = Partial<
  Pick<
    DemoCar,
    | "priceLabel"
    | "condition"
    | "fuelType"
    | "transmission"
    | "trim"
    | "color"
    | "mileage"
    | "hp"
    | "engineLabel"
    | "imagePath"
    | "galleryImagePaths"
    | "priceValue"
  >
>;

const buildCar = (
  id: string,
  category: CarCategory,
  brand: string,
  model: string,
  type: string,
  year: number,
  topSpeedKmh: number,
  torqueNm: number,
  description: string,
  clue: GuessCarClue,
  partSuffix: string,
  details: BuildCarDetails = {},
): DemoCar => {
  const label = `${brand} ${model}`;

  return {
    id,
    category,
    label,
    brand,
    model,
    type,
    year,
    topSpeedKmh,
    torqueNm,
    description,
    carImageUrl: buildPlaceholderImage(label, "Car"),
    imagePath: details.imagePath,
    galleryImagePaths: details.galleryImagePaths ?? [],
    partImageUrl: buildPlaceholderImage(label, partSuffix),
    clue,
    priceValue: details.priceValue,
    priceLabel:
      details.priceLabel ??
      (details.priceValue !== undefined ? `EGP ${details.priceValue.toLocaleString()}` : undefined),
    condition: details.condition,
    fuelType: details.fuelType,
    transmission: details.transmission,
    trim: details.trim,
    color: details.color,
    mileage: details.mileage,
    hp: details.hp,
    engineLabel: details.engineLabel,
  };
};

export const DEMO_CARS: DemoCar[] = [
  buildCar(
    "gtr-r35",
    "SELL",
    "Nissan",
    "GT-R R35",
    "AWD coupe",
    2020,
    315,
    633,
    "Twin-turbo grip and everyday supercar energy in one brutal package.",
    { country: "Japan", cc: 3799, hp: 565, torque: 633, special: "Twin-turbo AWD coupe" },
    "Headlight",
    { imagePath: buildAssetPath("nissan-gtr-r35.png"), mileage: 18000, priceValue: 8500000 },
  ),
  buildCar(
    "supra-a80",
    "SELL",
    "Toyota",
    "Supra A80",
    "Sports coupe",
    1998,
    250,
    427,
    "A tuner icon with the kind of legend status everyone recognizes instantly.",
    { country: "Japan", cc: 2997, hp: 320, torque: 427, special: "2JZ legend" },
    "Tail Light",
    { imagePath: buildAssetPath("toyota-supra-a80.png"), mileage: 92000, priceValue: 3200000 },
  ),
  buildCar(
    "civic-type-r",
    "SELL",
    "Honda",
    "Civic Type R FK8",
    "Hot hatch",
    2021,
    272,
    400,
    "Sharp front-wheel-drive performance that feels fast even before the race starts.",
    { country: "Japan", cc: 1996, hp: 306, torque: 400, special: "Front-wheel-drive hot hatch" },
    "Wheel",
    { imagePath: buildAssetPath("honda-civic-type-r-fk8.png"), mileage: 26000, priceValue: 2650000 },
  ),
  buildCar(
    "mx5-nd",
    "SELL",
    "Mazda",
    "MX-5 ND",
    "Roadster",
    2023,
    219,
    205,
    "Lightweight fun built around balance, simplicity, and a pure driver connection.",
    { country: "Japan", cc: 1998, hp: 181, torque: 205, special: "Lightweight roadster" },
    "Mirror",
    { imagePath: buildAssetPath("mazda-mx5-nd.png"), mileage: 11000, priceValue: 2400000 },
  ),
  buildCar(
    "mercedes-c180",
    "SELL",
    "Mercedes-Benz",
    "C180 AMG",
    "Sedan",
    2025,
    170,
    250,
    "A clean black C-Class daily with AMG styling, automatic drive, and showroom condition.",
    { country: "Germany", cc: 1497, hp: 170, torque: 250, special: "Inline-4 turbo sedan" },
    "Headlight",
    {
      imagePath: buildAssetPath("MercedesCKlasse_neu_2021_08.png"),
      galleryImagePaths: [
        buildAssetPath("MercedesCKlasse_neu_2021_08.png"),
        buildAssetPath("mercedes-c180-1.jpg"),
        buildAssetPath("mercedes-c180-2.jpg"),
        buildAssetPath("mercedes-c180-3.jpg"),
        buildAssetPath("mercedes-c180-4.jpg"),
      ],
      priceValue: 3400000,
      priceLabel: "EGP 3,400,000",
      condition: "New",
      fuelType: "Benzine",
      transmission: "Automatic",
      trim: "AMG",
      color: "Black",
      mileage: 0,
      hp: 170,
      engineLabel: "Inline-4 turbo 1.5L",
    },
  ),
  buildCar(
    "lancer-evo-9",
    "SELL",
    "Mitsubishi",
    "Lancer Evo IX",
    "Rally sedan",
    2006,
    250,
    392,
    "Turbocharged rally heritage with a huge fanbase and unmistakable attitude.",
    { country: "Japan", cc: 1997, hp: 286, torque: 392, special: "Turbo rally icon" },
    "Spoiler",
    { mileage: 88000, priceValue: 1900000 },
  ),
  buildCar(
    "wrx-sti",
    "SELL",
    "Subaru",
    "WRX STI",
    "AWD sedan",
    2021,
    255,
    393,
    "A boxer-powered street weapon with rally DNA in every launch.",
    { country: "Japan", cc: 2457, hp: 310, torque: 393, special: "Boxer AWD sedan" },
    "Bonnet Scoop",
    { mileage: 34000, priceValue: 2850000 },
  ),
  buildCar(
    "mustang-gt",
    "SELL",
    "Ford",
    "Mustang GT",
    "Muscle coupe",
    2023,
    250,
    556,
    "Naturally aspirated V8 power with old-school character and modern tech.",
    { country: "USA", cc: 5038, hp: 450, torque: 556, special: "Naturally aspirated V8" },
    "Taillight",
    { mileage: 12000, priceValue: 4750000 },
  ),
  buildCar(
    "camaro-zl1",
    "SELL",
    "Chevrolet",
    "Camaro ZL1",
    "Muscle coupe",
    2023,
    318,
    881,
    "Supercharged power and track-ready aggression without any subtlety.",
    { country: "USA", cc: 6162, hp: 650, torque: 881, special: "Supercharged muscle car" },
    "Front Splitter",
    { priceValue: 6200000 },
  ),
  buildCar(
    "challenger-hellcat",
    "SELL",
    "Dodge",
    "Challenger Hellcat",
    "Muscle coupe",
    2022,
    327,
    881,
    "Pure straight-line chaos in a huge coupe silhouette.",
    { country: "USA", cc: 6166, hp: 717, torque: 881, special: "Supercharged coupe" },
    "Hood Scoop",
    { priceValue: 7100000 },
  ),
  buildCar(
    "corvette-c8",
    "SELL",
    "Chevrolet",
    "Corvette C8",
    "Mid-engine coupe",
    2024,
    312,
    637,
    "America's mid-engine answer to exotic performance and presence.",
    { country: "USA", cc: 6162, hp: 495, torque: 637, special: "Mid-engine American sports car" },
    "Side Intake",
    { priceValue: 8900000 },
  ),
  buildCar(
    "porsche-911-carrera-gts",
    "UPDATE",
    "Porsche",
    "911 Carrera GTS",
    "Hybrid sports coupe",
    2025,
    312,
    610,
    "The current Carrera GTS blends classic 911 shape with T-Hybrid punch and a sharper everyday setup.",
    { country: "Germany", cc: 3591, hp: 532, torque: 610, special: "T-Hybrid rear-engine sports coupe" },
    "Rear Light",
    { imagePath: buildAssetPath("porsche-911-carrera-gts-side.png") },
  ),
  buildCar(
    "mercedes-cls63-s",
    "UPDATE",
    "Mercedes-AMG",
    "CLS 63 S",
    "Performance sedan",
    2016,
    300,
    800,
    "A hand-built biturbo V8 super-sedan with long-body coupe styling and serious AMG torque.",
    { country: "Germany", cc: 5461, hp: 577, torque: 800, special: "Biturbo V8 4MATIC supersedan" },
    "Headlight",
    { imagePath: buildAssetPath("mercedes-cls63-s.png") },
  ),
  buildCar(
    "porsche-911-992",
    "UPDATE",
    "Porsche",
    "911 Carrera 992",
    "Sports car",
    2024,
    293,
    450,
    "The rear-engine icon that blends heritage, precision, and modern pace.",
    { country: "Germany", cc: 2981, hp: 379, torque: 450, special: "Rear-engine sports car" },
    "Rear Light",
  ),
  buildCar(
    "amg-gt",
    "UPDATE",
    "Mercedes-AMG",
    "GT",
    "Grand tourer",
    2021,
    304,
    630,
    "Long hood, huge V8 torque, and a shape that always looks expensive.",
    { country: "Germany", cc: 3982, hp: 469, torque: 630, special: "Front-mid V8 coupe" },
    "Grille",
  ),
  buildCar(
    "golf-r",
    "UPDATE",
    "Volkswagen",
    "Golf R",
    "Performance hatch",
    2024,
    250,
    420,
    "Subtle looks outside, big all-weather pace underneath.",
    { country: "Germany", cc: 1984, hp: 315, torque: 420, special: "AWD hatchback" },
    "Badge",
  ),
  buildCar(
    "bmw-m3-e46",
    "UPDATE",
    "BMW",
    "M3 E46",
    "Performance coupe",
    2005,
    250,
    355,
    "One of the all-time great sports coupes with a soundtrack people still chase.",
    { country: "Germany", cc: 3246, hp: 333, torque: 355, special: "Straight-six coupe" },
    "Fender",
  ),
  buildCar(
    "viper-acr",
    "UPDATE",
    "Dodge",
    "Viper ACR",
    "Track coupe",
    2017,
    285,
    814,
    "Big aero, big V10, and almost no interest in being civilized.",
    { country: "USA", cc: 8382, hp: 645, torque: 814, special: "Big V10 track monster" },
    "Wing",
  ),
  buildCar(
    "ferrari-488",
    "UPDATE",
    "Ferrari",
    "488 GTB",
    "Supercar",
    2020,
    330,
    760,
    "Turbo V8 speed wrapped in one of the most recognizable badges on earth.",
    { country: "Italy", cc: 3902, hp: 661, torque: 760, special: "Turbocharged V8 exotic" },
    "Intake",
  ),
  buildCar(
    "lamborghini-huracan",
    "UPDATE",
    "Lamborghini",
    "Huracan EVO",
    "Supercar",
    2021,
    325,
    600,
    "Sharp edges, V10 noise, and instant game-screen energy.",
    { country: "Italy", cc: 5204, hp: 631, torque: 600, special: "Naturally aspirated V10" },
    "Hex Light",
  ),
  buildCar(
    "alfa-giulia-qv",
    "UPDATE",
    "Alfa Romeo",
    "Giulia Quadrifoglio",
    "Sports sedan",
    2023,
    307,
    600,
    "A practical shape with Ferrari-related muscle under the hood.",
    { country: "Italy", cc: 2891, hp: 505, torque: 600, special: "Twin-turbo sports sedan" },
    "Badge",
  ),
  buildCar(
    "renault-megane-rs",
    "UPDATE",
    "Renault",
    "Megane RS",
    "Track hatch",
    2021,
    255,
    420,
    "Compact size, sharp setup, and proper hot hatch energy.",
    { country: "France", cc: 1798, hp: 296, torque: 420, special: "Track-focused hatchback" },
    "Brake Caliper",
  ),
];

export const getCarsByCategory = (category: CarCategory): DemoCar[] =>
  DEMO_CARS.filter((car) => car.category === category);

export const getCatalogCarById = (carId: string): DemoCar | undefined =>
  DEMO_CARS.find((car) => car.id === carId);

const resolveAssetUrl = (baseUrl: string, assetPath: string): string =>
  `${baseUrl}${assetPath}`;

export const toCatalogCarSummaryDto = (
  car: DemoCar,
  baseUrl: string,
): CatalogCarSummaryDto => ({
  id: car.id,
  category: car.category,
  brand: car.brand,
  model: car.model,
  type: car.type,
  year: car.year,
  topSpeedKmh: car.topSpeedKmh,
  torqueNm: car.torqueNm,
  imageUrl: car.imagePath ? resolveAssetUrl(baseUrl, car.imagePath) : car.carImageUrl,
  description: car.description,
  priceValue: car.priceValue,
  priceLabel: car.priceLabel,
  condition: car.condition,
  fuelType: car.fuelType,
  transmission: car.transmission,
  trim: car.trim,
  color: car.color,
  mileage: car.mileage,
});

export const toCatalogCarDetailDto = (
  car: DemoCar,
  baseUrl: string,
): CatalogCarDetailDto => ({
  ...toCatalogCarSummaryDto(car, baseUrl),
  galleryImageUrls:
    car.galleryImagePaths.length > 0
      ? car.galleryImagePaths.map((assetPath) => resolveAssetUrl(baseUrl, assetPath))
      : [car.imagePath ? resolveAssetUrl(baseUrl, car.imagePath) : car.carImageUrl],
  condition: car.condition,
  fuelType: car.fuelType,
  transmission: car.transmission,
  trim: car.trim,
  color: car.color,
  mileage: car.mileage,
  hp: car.hp,
  engineLabel: car.engineLabel,
});
