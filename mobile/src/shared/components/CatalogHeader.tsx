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
};

export const CatalogHeader = ({
  title,
  searchPlaceholder,
  value,
  onChangeText,
  onClear,
}: CatalogHeaderProps) => (
  <View style={[styles.root, !title ? styles.rootCompact : null]}>
    {title ? <Text style={styles.title}>{title}</Text> : null}
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
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
