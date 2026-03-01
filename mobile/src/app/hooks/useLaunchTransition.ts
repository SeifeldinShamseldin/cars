import { useCallback, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

type LaunchPhase = "visible" | "exiting" | "hidden";

export const useLaunchTransition = () => {
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>("visible");
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const launchScale = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const appTranslateY = useRef(new Animated.Value(18)).current;
  const appScale = useRef(new Animated.Value(0.985)).current;

  const continueFromLaunch = useCallback(() => {
    if (launchPhase !== "visible") {
      return;
    }

    setLaunchPhase("exiting");
    Animated.parallel([
      Animated.timing(launchOpacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(launchScale, {
        toValue: 1.06,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appTranslateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appScale, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLaunchPhase("hidden");
    });
  }, [appOpacity, appScale, appTranslateY, launchOpacity, launchPhase, launchScale]);

  return {
    launchPhase,
    showLaunch: launchPhase !== "hidden",
    launchOpacity,
    launchScale,
    appOpacity,
    appTranslateY,
    appScale,
    continueFromLaunch,
  };
};
