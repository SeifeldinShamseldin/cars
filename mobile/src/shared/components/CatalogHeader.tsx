import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";

type CatalogHeaderProps = {
  title?: string;
  searchPlaceholder: string;
  value: string;
  onChangeText: (value: string) => void;
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
  <View style={[styles.root, !title ? styles.rootCompact : null]}>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {editable ? (
      <View style={styles.searchShell}>
        <Icon source="magnify" size={22} color={appColors.inkSoft} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={searchPlaceholder}
          placeholderTextColor={appColors.inkSoft}
          style={styles.input}
          selectionColor={appColors.primary}
        />
        {value.length > 0 ? (
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Icon source="close" size={20} color={appColors.inkSoft} />
          </Pressable>
        ) : null}
      </View>
    ) : (
      <Pressable style={styles.searchShell} onPress={onPress}>
        <Icon source="magnify" size={22} color={appColors.inkSoft} />
        <Text
          style={[
            styles.triggerText,
            value.length === 0 ? styles.triggerPlaceholder : null,
          ]}
          numberOfLines={1}
        >
          {value.length > 0 ? value : searchPlaceholder}
        </Text>
        {value.length > 0 ? (
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Icon source="close" size={20} color={appColors.inkSoft} />
          </Pressable>
        ) : null}
      </Pressable>
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
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 32,
    textTransform: "uppercase",
  },
  searchShell: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.ice,
    backgroundColor: "rgba(20, 24, 29, 0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: appColors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 17,
    lineHeight: 22,
    paddingVertical: 0,
  },
  triggerText: {
    flex: 1,
    color: appColors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 17,
    lineHeight: 22,
  },
  triggerPlaceholder: {
    color: appColors.inkSoft,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
