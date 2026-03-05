import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { appColors } from "../theme/paperTheme";
import { appRadii, appShadows, appSpacing } from "../theme/tokens";
import { fontFamilies } from "../theme/typography";

type BackArrowProps = {
  label?: string;
  onPress: () => void;
};

export const BackArrow = ({ label, onPress }: BackArrowProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label ?? "Back"}
    hitSlop={12}
    onPress={onPress}
    style={styles.pressable}
  >
    <View style={styles.iconWrap}>
      <Icon source="chevron-left" size={26} color={appColors.inkDark} />
    </View>
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.sm,
  },
  iconWrap: {
    width: 45,
    height: 45,
    borderRadius: appRadii.xxl2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surfaceBright,
    ...appShadows.sm,
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
