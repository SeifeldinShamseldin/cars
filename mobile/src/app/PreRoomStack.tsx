import type { ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { ScreenShell } from "../shared/components/ScreenShell";
import { SwipeBackOverlay } from "../shared/components/SwipeBackOverlay";
import { CarDetailScreen } from "../features/common/components/CarDetailScreen";

type PreRoomStackProps = {
  footer?: ReactNode;
  mountedTabs: ReactNode;
  modeDetail: ReactNode;
  showModeDetail: boolean;
  selectedCarId: string | null;
  modeOpacity: Animated.Value;
  modeTranslateY: Animated.Value;
  detailOpacity: Animated.Value;
  detailTranslateY: Animated.Value;
  onDismissModeSwipe: () => void;
  onDismissCarSwipe: () => void;
  onCloseCar: () => void;
  backLabel: string;
  typeLabel: string;
  topSpeedLabel: string;
  torqueLabel: string;
  yearLabel: string;
};

export const PreRoomStack = ({
  footer,
  mountedTabs,
  modeDetail,
  showModeDetail,
  selectedCarId,
  modeOpacity,
  modeTranslateY,
  detailOpacity,
  detailTranslateY,
  onDismissModeSwipe,
  onDismissCarSwipe,
  onCloseCar,
  backLabel,
  typeLabel,
  topSpeedLabel,
  torqueLabel,
  yearLabel,
}: PreRoomStackProps) => (
  <View style={styles.tabStack}>
    <ScreenShell footer={footer} scrollEnabled={false}>
      {mountedTabs}
    </ScreenShell>
    {showModeDetail ? (
      <Animated.View
        style={[
          styles.tabLayer,
          {
            opacity: modeOpacity,
            transform: [{ translateY: modeTranslateY }],
          },
        ]}
      >
        <SwipeBackOverlay onBack={onDismissModeSwipe}>
          <ScreenShell scrollEnabled={false}>{modeDetail}</ScreenShell>
        </SwipeBackOverlay>
      </Animated.View>
    ) : null}
    {selectedCarId ? (
      <Animated.View
        style={[
          styles.tabLayer,
          {
            opacity: detailOpacity,
            transform: [{ translateY: detailTranslateY }],
          },
        ]}
      >
        <SwipeBackOverlay onBack={onDismissCarSwipe}>
          <ScreenShell scrollEnabled={false}>
            <CarDetailScreen
              carId={selectedCarId}
              backLabel={backLabel}
              typeLabel={typeLabel}
              topSpeedLabel={topSpeedLabel}
              torqueLabel={torqueLabel}
              yearLabel={yearLabel}
              onBack={onCloseCar}
            />
          </ScreenShell>
        </SwipeBackOverlay>
      </Animated.View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  tabStack: {
    flex: 1,
  },
  tabLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
