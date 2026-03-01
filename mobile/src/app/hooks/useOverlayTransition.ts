import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const useOverlayTransition = (isVisible: boolean) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!isVisible) {
      opacity.setValue(0);
      translateY.setValue(18);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, opacity, translateY]);

  const close = useCallback(
    (onHidden: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 18,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(onHidden);
    },
    [opacity, translateY],
  );

  const dismiss = useCallback(
    (onHidden: () => void) => {
      opacity.setValue(0);
      translateY.setValue(18);
      onHidden();
    },
    [opacity, translateY],
  );

  return {
    opacity,
    translateY,
    close,
    dismiss,
  };
};
