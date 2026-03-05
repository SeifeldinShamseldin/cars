import { CarsCatalogFeed } from "../../catalog/components/CarsCatalogFeed";
import {
  useUpdatesCatalogFeed,
  type UseUpdatesCatalogFeedParams,
} from "../../../shared/hooks/useCarsCatalogFeed";

type CarNewsHomeScreenProps = {
  feedParams: UseUpdatesCatalogFeedParams;
};

export const CarNewsHomeScreen = ({ feedParams }: CarNewsHomeScreenProps) => {
  const feedProps = useUpdatesCatalogFeed(feedParams);

  return <CarsCatalogFeed {...feedProps} />;
};
