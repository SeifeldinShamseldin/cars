import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { ScreenShell } from "./ScreenShell";

const SWIPE_EDGE_WIDTH = 48;
const SWIPE_COMPLETE_THRESHOLD = 96;
const SCREEN_WIDTH = Dimensions.get("window").width;

type AnimatedScalar = Animated.Value | Animated.AnimatedInterpolation<number>;

type OverlayScreenProps = PropsWithChildren<{
  isActive?: boolean;
  opacity: AnimatedScalar;
  translateY: AnimatedScalar;
  onBack: () => void;
  scrollEnabled?: boolean;
  swipeEnabled?: boolean;
  padded?: boolean;
  safeAreaEdges?: Edge[];
}>;

export const OverlayScreen = ({
  children,
  isActive = true,
  opacity,
  translateY,
  onBack,
  scrollEnabled = false,
  swipeEnabled = true,
  padded = true,
  safeAreaEdges,
}: OverlayScreenProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const onBackRef = useRef(onBack);
  const swipeEnabledRef = useRef(swipeEnabled);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    swipeEnabledRef.current = swipeEnabled;
  }, [swipeEnabled]);

  useEffect(() => {
    if (!isActive) {
      translateX.setValue(0);
    }
  }, [isActive, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        swipeEnabledRef.current &&
        gesture.dx > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(Math.max(0, gesture.dx));
      },
      onPanResponderRelease: (_, gesture) => {
        const backAction = onBackRef.current;

        if (gesture.dx > SWIPE_COMPLETE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            backAction();
          });
          return;
        }

        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      pointerEvents={isActive ? "auto" : "none"}
      style={[
        styles.layer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View style={[styles.overlay, { transform: [{ translateX }] }]}>
        {swipeEnabled ? <View style={styles.edgeHandle} {...panResponder.panHandlers} /> : null}
        <ScreenShell
          scrollEnabled={scrollEnabled}
          padded={padded}
          safeAreaEdges={safeAreaEdges}
        >
          {children}
        </ScreenShell>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
  edgeHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SWIPE_EDGE_WIDTH,
    zIndex: 30,
    elevation: 30,
  },
});
