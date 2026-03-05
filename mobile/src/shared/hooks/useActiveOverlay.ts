import type { ReactNode } from "react";
import type { Animated } from "react-native";
import type { Edge } from "react-native-safe-area-context";

type AnimatedScalar = Animated.Value | Animated.AnimatedInterpolation<number>;

export type OverlayDescriptor = {
  id: string;
  isActive: boolean;
  opacity: AnimatedScalar;
  translateY: AnimatedScalar;
  onBack: () => void;
  content: ReactNode;
  scrollEnabled?: boolean;
  swipeEnabled?: boolean;
  padded?: boolean;
  safeAreaEdges?: Edge[];
};

export type ActiveOverlay = Omit<OverlayDescriptor, "id" | "isActive">;

export const useActiveOverlay = (
  overlays: OverlayDescriptor[],
): ActiveOverlay | null => {
  const activeOverlay = overlays.find((overlay) => overlay.isActive);

  if (!activeOverlay) {
    return null;
  }

  const { id: _id, isActive: _isActive, ...overlay } = activeOverlay;

  return overlay;
};
