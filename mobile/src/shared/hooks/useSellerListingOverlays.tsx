import type { ReactNode } from "react";
import type { Animated } from "react-native";

import { SellerAccountScreen } from "../../features/profile/screens/SellerAccountScreen";
import { SellerHistoryScreen } from "../../features/profile/screens/SellerHistoryScreen";
import { SellerPostCarScreen } from "../../features/sellcar/screens/SellerPostCarScreen";
import type { SellerListingLayer } from "./useSellerListingFlow";
import { useOverlayTransition } from "./useOverlayTransition";

type AnimatedScalar = Animated.Value | Animated.AnimatedInterpolation<number>;

export type SellerListingOverlay = {
  id: "seller-account" | "seller-history" | "seller-post";
  isActive: boolean;
  opacity: AnimatedScalar;
  translateY: AnimatedScalar;
  onBack: () => void;
  scrollEnabled: boolean;
  swipeEnabled: boolean;
  content: ReactNode;
};

type UseSellerListingOverlaysParams = {
  layerStack: SellerListingLayer[];
  shouldWarmHistoryMounted?: boolean;
  accountScreenProps: Parameters<typeof SellerAccountScreen>[0];
  historyScreenProps: Parameters<typeof SellerHistoryScreen>[0];
  postCarScreenProps: Parameters<typeof SellerPostCarScreen>[0];
};

const hasLayer = (
  layerStack: SellerListingLayer[],
  layer: SellerListingLayer,
): boolean => layerStack.includes(layer);

export const useSellerListingOverlays = ({
  layerStack,
  shouldWarmHistoryMounted = false,
  accountScreenProps,
  historyScreenProps,
  postCarScreenProps,
}: UseSellerListingOverlaysParams): SellerListingOverlay[] => {
  const isAccountActive = hasLayer(layerStack, "ACCOUNT");
  const isHistoryActive = hasLayer(layerStack, "HISTORY");
  const isPostActive = hasLayer(layerStack, "POST");
  const shouldMountHistory = shouldWarmHistoryMounted || isHistoryActive;

  const accountTransition = useOverlayTransition(isAccountActive);
  const historyTransition = useOverlayTransition(isHistoryActive);
  const postTransition = useOverlayTransition(isPostActive);

  const closeAccount = () => {
    accountTransition.close(accountScreenProps.onBack);
  };

  const closeHistory = () => {
    historyTransition.close(historyScreenProps.onBack);
  };

  const closePost = () => {
    postTransition.close(postCarScreenProps.onBack);
  };

  const overlays: SellerListingOverlay[] = [];

  if (isAccountActive) {
    overlays.push({
      id: "seller-account",
      isActive: true,
      opacity: accountTransition.opacity,
      translateY: accountTransition.translateY,
      onBack: closeAccount,
      scrollEnabled: false,
      swipeEnabled: true,
      content: <SellerAccountScreen {...accountScreenProps} onBack={closeAccount} />,
    });
  }

  if (shouldMountHistory) {
    overlays.push({
      id: "seller-history",
      isActive: isHistoryActive,
      opacity: historyTransition.opacity,
      translateY: historyTransition.translateY,
      onBack: closeHistory,
      scrollEnabled: false,
      swipeEnabled: true,
      content: <SellerHistoryScreen {...historyScreenProps} onBack={closeHistory} />,
    });
  }

  if (isPostActive) {
    overlays.push({
      id: "seller-post",
      isActive: true,
      opacity: postTransition.opacity,
      translateY: postTransition.translateY,
      onBack: closePost,
      scrollEnabled: false,
      swipeEnabled: true,
      content: <SellerPostCarScreen {...postCarScreenProps} onBack={closePost} />,
    });
  }

  return overlays;
};
