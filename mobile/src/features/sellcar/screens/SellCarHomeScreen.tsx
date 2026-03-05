import {
  CarsCatalogFeed,
  type CarsCatalogFeedProps,
} from "../../catalog/components/CarsCatalogFeed";

type SellCarHomeScreenProps = {
  feedProps: CarsCatalogFeedProps;
};

export const SellCarHomeScreen = ({ feedProps }: SellCarHomeScreenProps) => (
  <CarsCatalogFeed {...feedProps} />
);
