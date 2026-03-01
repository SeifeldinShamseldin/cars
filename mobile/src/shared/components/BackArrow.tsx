import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";

type BackArrowProps = {
  label?: string;
  onPress: () => void;
};

export const BackArrow = ({ label, onPress }: BackArrowProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label ?? "Back"}
    hitSlop={10}
    onPress={onPress}
    style={styles.pressable}
  >
    <View style={styles.iconWrap}>
      <Icon source="arrow-left" size={24} color={appColors.ink} />
    </View>
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  label: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
