import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";
import {
  CarsCatalogFeed,
  type ActiveFilterBadge,
  type CarsCatalogFeedProps,
} from "./CarsCatalogFeed";

type SellSearchResultsScreenProps = {
  title: string;
  summary?: string;
  activeFilterBadges: ActiveFilterBadge[];
  onBack: () => void;
  feedProps: CarsCatalogFeedProps;
};

export const SellSearchResultsScreen = ({
  title,
  summary,
  activeFilterBadges,
  onBack,
  feedProps,
}: SellSearchResultsScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
      <BackArrow onPress={onBack} />
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>{title}</Text>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
      </View>
      </View>

      {activeFilterBadges.length > 0 ? (
        <View style={styles.badgesWrap}>
          {activeFilterBadges.map((badge) => (
            <Pressable key={badge.id} style={styles.badge}>
              <Text style={styles.badgeText}>{badge.label}</Text>
              <View style={styles.badgeIconWrap}>
                <Icon source="magnify" size={11} color={appColors.primary} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.feedWrap}>
        <CarsCatalogFeed {...feedProps} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTextWrap: {
    gap: 4,
  },
  title: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 34,
  },
  summary: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.primary,
    backgroundColor: appColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
  },
  badgeIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.primaryDeep,
  },
  feedWrap: {
    flex: 1,
  },
});
