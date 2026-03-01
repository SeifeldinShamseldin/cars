import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { formatCountdown, useCountdown } from "../lib/useCountdown";

type CountdownPillProps = {
  targetTime?: number;
  label?: string;
};

export const CountdownPill = ({ targetTime, label = "Time left" }: CountdownPillProps) => {
  const remainingMs = useCountdown(targetTime);

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.value}>
        {formatCountdown(remainingMs)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    minWidth: 110,
    borderWidth: 1,
    borderColor: "rgba(231, 211, 26, 0.24)",
  },
  label: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    letterSpacing: 0.4,
    lineHeight: 28,
    paddingTop: 2,
    paddingBottom: 2,
  },
});
