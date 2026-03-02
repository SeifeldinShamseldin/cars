import type { PropsWithChildren } from "react";
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";

const EDGE_WIDTH = 48;
const COMPLETE_THRESHOLD = 96;
const SCREEN_WIDTH = Dimensions.get("window").width;

type SwipeBackOverlayProps = PropsWithChildren<{
  onBack: () => void;
}>;

export const SwipeBackOverlay = ({
  children,
  onBack,
}: SwipeBackOverlayProps) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(Math.max(0, gesture.dx));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > COMPLETE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onBack();
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
      style={[styles.overlay, { transform: [{ translateX }] }]}
    >
      <View style={styles.edgeHandle} {...panResponder.panHandlers} />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  edgeHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_WIDTH,
    zIndex: 30,
    elevation: 30,
  },
});
