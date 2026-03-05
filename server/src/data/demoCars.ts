import type { GuessCarClue } from "../../shared/types/domain";

export type CarCategory = "SELL" | "UPDATE";
export type CarType =
  | "SEDAN"
  | "COUPE"
  | "SUV"
  | "HATCHBACK"
  | "CONVERTIBLE"
  | "CABRIOLET"
  | "CROSSOVER"
  | "WAGON"
  | "ESTATE"
  | "PICKUP"
  | "VAN"
  | "MINIVAN"
  | "ROADSTER";
export type Condition = "NEW" | "USED";
export type FuelType =
  | "PETROL"
  | "DIESEL"
  | "HYBRID"
  | "PLUG_IN_HYBRID"
  | "ELECTRIC"
  | "REEV"
  | "GAS";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type SellerType = "DEALER" | "OWNER";
export type YesNo = "YES" | "NO";

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
  condition?: Condition;
  fuelType?: FuelType;
  transmission?: Transmission;
  mileage?: number;
  rimSizeInches?: number;
  sellerType?: SellerType;
  sellerName?: string;
  telephone?: string;
  postedAt?: string;
  color?: string;
  isNegotiable?: YesNo;
  accidentHistory?: YesNo;
};

export type SellCarSummaryDto = {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  priceValue: number;
  condition: Condition;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  rimSizeInches: number;
  sellerType: SellerType;
  sellerName: string;
  telephone: string;
  postedAt: string;
  color: string;
  isNegotiable: YesNo;
  accidentHistory: YesNo;
};

export type UpdateCarSummaryDto = {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  year: number;
  galleryImageUrls: string[];
  description: string;
  postedAt: string;
};

export type CatalogCarSummaryDto = SellCarSummaryDto | UpdateCarSummaryDto;

const buildPlaceholderImage = (label: string, suffix: string): string =>
  `https://placehold.co/960x640?text=${encodeURIComponent(`${label} ${suffix}`)}`;

const buildAssetPath = (fileName: string): string => `/assets/catalog/${fileName}`;

type BuildCarDetails = Partial<
  Pick<
    DemoCar,
    | "condition"
    | "fuelType"
    | "transmission"
    | "mileage"
    | "rimSizeInches"
    | "sellerType"
    | "sellerName"
    | "telephone"
    | "postedAt"
    | "color"
    | "isNegotiable"
    | "accidentHistory"
    | "imagePath"
    | "galleryImagePaths"
    | "priceValue"
  >
>;

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
    condition: details.condition,
    fuelType: details.fuelType,
    transmission: details.transmission,
    mileage: details.mileage,
    rimSizeInches: details.rimSizeInches,
    sellerType: details.sellerType,
    sellerName: details.sellerName,
    telephone: details.telephone,
    postedAt: details.postedAt,
    color: details.color,
    isNegotiable: details.isNegotiable,
    accidentHistory: details.accidentHistory,
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
    {
      imagePath: buildAssetPath("nissan-gtr-r35.png"),
      mileage: 18000,
      priceValue: 8500000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      rimSizeInches: 20,
      sellerType: "OWNER",
      sellerName: "Omar Hassan",
      telephone: "+20 101 555 0141",
      postedAt: "2026-02-28T18:30:00.000Z",
      color: "White",
      isNegotiable: "YES",
      accidentHistory: "NO",
    },
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
    {
      imagePath: buildAssetPath("toyota-supra-a80.png"),
      mileage: 92000,
      priceValue: 3200000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "MANUAL",
      rimSizeInches: 18,
      sellerType: "OWNER",
      sellerName: "Karim Adel",
      telephone: "+20 102 555 0198",
      postedAt: "2026-02-25T20:15:00.000Z",
      color: "Red",
      isNegotiable: "YES",
      accidentHistory: "YES",
    },
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
    {
      imagePath: buildAssetPath("honda-civic-type-r-fk8.png"),
      mileage: 26000,
      priceValue: 2650000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "MANUAL",
      rimSizeInches: 19,
      sellerType: "DEALER",
      sellerName: "Apex Motors",
      telephone: "+20 111 444 8801",
      postedAt: "2026-02-24T12:10:00.000Z",
      color: "Championship White",
      isNegotiable: "NO",
      accidentHistory: "NO",
    },
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
    {
      imagePath: buildAssetPath("mazda-mx5-nd.png"),
      mileage: 11000,
      priceValue: 2400000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "MANUAL",
      rimSizeInches: 17,
      sellerType: "OWNER",
      sellerName: "Mina Nabil",
      telephone: "+20 120 333 7744",
      postedAt: "2026-02-23T16:40:00.000Z",
      color: "Soul Red",
      isNegotiable: "YES",
      accidentHistory: "NO",
    },
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
      condition: "NEW",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      mileage: 0,
      rimSizeInches: 18,
      sellerType: "DEALER",
      sellerName: "Silver Star Motors",
      telephone: "+20 100 888 2210",
      postedAt: "2026-03-01T08:30:00.000Z",
      color: "Black",
      isNegotiable: "NO",
      accidentHistory: "NO",
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
    {
      mileage: 88000,
      priceValue: 1900000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "MANUAL",
      rimSizeInches: 18,
      sellerType: "OWNER",
      sellerName: "Ahmed Samir",
      telephone: "+20 127 555 1020",
      postedAt: "2026-02-19T19:00:00.000Z",
      color: "Silver",
      isNegotiable: "YES",
      accidentHistory: "YES",
    },
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
    {
      mileage: 34000,
      priceValue: 2850000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "MANUAL",
      rimSizeInches: 18,
      sellerType: "DEALER",
      sellerName: "Boxer Auto Hub",
      telephone: "+20 115 212 9090",
      postedAt: "2026-02-18T14:20:00.000Z",
      color: "Blue",
      isNegotiable: "NO",
      accidentHistory: "NO",
    },
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
    {
      mileage: 12000,
      priceValue: 4750000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      rimSizeInches: 19,
      sellerType: "DEALER",
      sellerName: "Blue Oval Performance",
      telephone: "+20 109 400 6633",
      postedAt: "2026-02-17T11:05:00.000Z",
      color: "Grabber Blue",
      isNegotiable: "NO",
      accidentHistory: "NO",
    },
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
    {
      priceValue: 6200000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      rimSizeInches: 20,
      sellerType: "DEALER",
      sellerName: "Torque House",
      telephone: "+20 100 707 4545",
      postedAt: "2026-02-15T17:45:00.000Z",
      color: "Yellow",
      isNegotiable: "NO",
      accidentHistory: "NO",
    },
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
    {
      priceValue: 7100000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      rimSizeInches: 20,
      sellerType: "OWNER",
      sellerName: "Youssef Khaled",
      telephone: "+20 122 996 1188",
      postedAt: "2026-02-12T21:10:00.000Z",
      color: "Plum Crazy",
      isNegotiable: "YES",
      accidentHistory: "NO",
    },
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
    {
      priceValue: 8900000,
      condition: "USED",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      mileage: 9000,
      rimSizeInches: 20,
      sellerType: "DEALER",
      sellerName: "Mid Engine Gallery",
      telephone: "+20 111 202 7733",
      postedAt: "2026-02-10T13:25:00.000Z",
      color: "Torch Red",
      isNegotiable: "NO",
      accidentHistory: "NO",
    },
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
    {
      imagePath: buildAssetPath("porsche-911-carrera-gts-side.png"),
      postedAt: "2026-02-27T09:30:00.000Z",
    },
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
    {
      imagePath: buildAssetPath("mercedes-cls63-s.png"),
      postedAt: "2026-02-21T15:00:00.000Z",
    },
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
    { postedAt: "2026-02-18T08:00:00.000Z" },
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
    { postedAt: "2026-02-14T13:40:00.000Z" },
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
    { postedAt: "2026-02-12T11:20:00.000Z" },
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
    { postedAt: "2026-02-09T17:10:00.000Z" },
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
    { postedAt: "2026-02-06T10:50:00.000Z" },
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
    { postedAt: "2026-02-03T12:05:00.000Z" },
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
    { postedAt: "2026-01-30T14:25:00.000Z" },
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
    { postedAt: "2026-01-26T09:45:00.000Z" },
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
    { postedAt: "2026-01-22T16:30:00.000Z" },
  ),
];

export const getCarsByCategory = (category: CarCategory): DemoCar[] =>
  DEMO_CARS.filter((car) => car.category === category);

const resolveAssetUrl = (baseUrl: string, assetPath: string): string =>
  `${baseUrl}${assetPath}`;

export const toCatalogCarSummaryDto = (
  car: DemoCar,
  baseUrl: string,
): CatalogCarSummaryDto => {
  const galleryImageUrls =
    car.galleryImagePaths.length > 0
      ? car.galleryImagePaths.map((assetPath) => resolveAssetUrl(baseUrl, assetPath))
      : [car.imagePath ? resolveAssetUrl(baseUrl, car.imagePath) : car.carImageUrl];

  if (car.category === "UPDATE") {
    return {
      id: car.id,
      brand: car.brand,
      model: car.model,
      type: normalizeCarType(car.type),
      year: car.year,
      galleryImageUrls,
      description: car.description,
      postedAt: car.postedAt ?? new Date().toISOString(),
    };
  }

  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    type: normalizeCarType(car.type),
    year: car.year,
    galleryImageUrls,
    description: car.description,
    priceValue: car.priceValue ?? 0,
    condition: car.condition ?? "USED",
    fuelType: car.fuelType ?? "PETROL",
    transmission: car.transmission ?? "AUTOMATIC",
    mileage: car.mileage ?? 0,
    rimSizeInches: car.rimSizeInches ?? 18,
    sellerType: car.sellerType ?? "OWNER",
    sellerName: car.sellerName ?? `${car.brand} seller`,
    telephone: car.telephone ?? "+20 100 000 0000",
    postedAt: car.postedAt ?? new Date().toISOString(),
    color: car.color ?? "Unknown",
    isNegotiable: car.isNegotiable ?? "NO",
    accidentHistory: car.accidentHistory ?? "NO",
  };
};
