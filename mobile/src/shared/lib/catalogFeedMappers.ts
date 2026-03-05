import { isSellCar, type CarSummary } from "../api/catalog";
import type { CatalogFeedCardViewModel } from "../../features/catalog/components/CarsCatalogFeed";
import type { HeroCardViewModel } from "../../features/catalog/components/CarsHeroScreen";
import {
  formatCatalogDate,
  formatCatalogEnumLabel,
  formatCatalogPrice,
} from "./catalogPresentation";

export const buildHeroCard = ({
  car,
  typeLabel,
  priceLabel,
  sellerTypeLabel,
  postedAtLabel,
}: {
  car: CarSummary;
  typeLabel: string;
  priceLabel: string;
  sellerTypeLabel: string;
  postedAtLabel: string;
}): HeroCardViewModel => ({
  id: car.id,
  brand: car.brand,
  model: car.model,
  year: car.year,
  imageUrl: car.galleryImageUrls[0] ?? "",
  specItems: isSellCar(car)
    ? [
        { label: typeLabel, value: formatCatalogEnumLabel(car.type) },
        { label: sellerTypeLabel, value: formatCatalogEnumLabel(car.sellerType) },
        { label: priceLabel, value: formatCatalogPrice(car.priceValue) },
      ]
    : [
        { label: typeLabel, value: formatCatalogEnumLabel(car.type) },
        {
          label: postedAtLabel,
          value: formatCatalogDate(car.postedAt, { month: "short", day: "numeric" }),
        },
      ],
});

export const buildFeedCard = ({
  car,
  sellerTypeLabel,
  postedAtLabel,
}: {
  car: CarSummary;
  sellerTypeLabel: string;
  postedAtLabel: string;
}): CatalogFeedCardViewModel => ({
  id: car.id,
  imageUrl: car.galleryImageUrls[0] ?? "",
  primaryText: isSellCar(car)
    ? formatCatalogPrice(car.priceValue)
    : formatCatalogDate(car.postedAt),
  year: car.year,
  title: `${car.brand} ${car.model}`,
  metaBadges: isSellCar(car)
    ? [
        formatCatalogEnumLabel(car.type),
        `${sellerTypeLabel}: ${formatCatalogEnumLabel(car.sellerType)}`,
        formatCatalogEnumLabel(car.fuelType),
      ]
    : [
        formatCatalogEnumLabel(car.type),
        `${postedAtLabel}: ${formatCatalogDate(car.postedAt)}`,
      ],
  description: car.description,
});
