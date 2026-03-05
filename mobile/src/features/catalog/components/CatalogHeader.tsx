import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type CatalogHeaderProps = {
  title?: string;
  searchPlaceholder: string;
  value: string;
  onChangeText?: (value: string) => void;
  onClear: () => void;
  editable?: boolean;
  onPress?: () => void;
};

export const CatalogHeader = ({
  title,
  searchPlaceholder,
  value,
  onChangeText,
  onClear,
  editable = true,
  onPress,
}: CatalogHeaderProps) => (
  <View style={[styles.root, !title && styles.rootCompact]}>
    {title ? <Text style={styles.title}>{title}</Text> : null}

    {editable ? (
      <View style={styles.searchShell}>
        <Icon source="magnify" size={20} color={appColors.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={searchPlaceholder}
          placeholderTextColor={appColors.muted}
          style={styles.input}
          selectionColor={appColors.primary}
        />
        {value.length > 0 ? (
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Icon source="close" size={18} color={appColors.muted} />
          </Pressable>
        ) : null}
      </View>
    ) : (
      <View style={styles.searchShell}>
        <Pressable style={styles.triggerPressable} onPress={onPress}>
          <Icon source="magnify" size={20} color={appColors.muted} />
          <Text
            style={[styles.triggerText, value.length === 0 && styles.triggerPlaceholder]}
            numberOfLines={1}
          >
            {value.length > 0 ? value : searchPlaceholder}
          </Text>
        </Pressable>
        {value.length > 0 ? (
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Icon source="close" size={18} color={appColors.muted} />
          </Pressable>
        ) : null}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  root: {
    gap: 12,
    backgroundColor: "transparent",
  },
  rootCompact: {
    gap: 0,
  },
  title: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 32,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  searchShell: {
    minHeight: 56,
    borderRadius: appRadii.xl,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.md2,
    paddingHorizontal: appSpacing.xl,
  },
  input: {
    flex: 1,
    color: appColors.white,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 0,
  },
  triggerPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.md2,
  },
  triggerText: {
    flex: 1,
    color: appColors.white,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 20,
  },
  triggerPlaceholder: {
    color: appColors.muted,
  },
  clearButton: {
    width: appSpacing.xxxl2,
    height: appSpacing.xxxl2,
    alignItems: "center",
    justifyContent: "center",
  },
});
