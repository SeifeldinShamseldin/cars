import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const useKeyedTransition = (transitionKey: string | null) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!transitionKey) {
      opacity.setValue(0);
      translateY.setValue(18);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(18);

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
  }, [opacity, transitionKey, translateY]);

  return {
    opacity,
    translateY,
  };
};
