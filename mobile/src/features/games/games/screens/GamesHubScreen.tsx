import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { appColors } from "../../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../../shared/theme/typography";
import type { HubGame } from "../../types";

type GamesHubScreenProps = {
  title: string;
  subtitle: string;
  tapToPlayLabel: string;
  cards: Array<{
    id: HubGame;
    title: string;
    description: string;
  }>;
  onOpenGame: (game: HubGame) => void;
};

export const GamesHubScreen = ({
  title,
  subtitle,
  tapToPlayLabel,
  cards,
  onOpenGame,
}: GamesHubScreenProps) => (
  <View style={styles.root}>
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>Party modes</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>

    <View style={styles.tipBanner}>
      <Text style={styles.tipText}>Choose one of the two live multiplayer modes.</Text>
    </View>

    <View style={styles.grid}>
      {cards.map((game, index) => {
        return (
          <Pressable
            key={game.id}
            onPress={() => onOpenGame(game.id)}
            style={styles.cardPressable}
          >
            <Card
              mode="elevated"
              style={[styles.card, index === 0 ? styles.cardPrimary : styles.cardNeutral]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.cardAccent,
                      index === 0 ? styles.cardAccentLight : styles.cardAccentDark,
                    ]}
                  />
                  <Text style={[styles.cardIndex, index === 0 && styles.cardIndexActive]}>
                    0{index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.cardTitle,
                    index === 0 ? styles.cardTitleLight : styles.cardTitleDark,
                  ]}
                >
                  {game.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.cardDescription,
                    index === 0 ? styles.cardDescriptionLight : styles.cardDescriptionDark,
                  ]}
                >
                  {game.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.cardCta,
                      index === 0 ? styles.cardTitleLight : styles.cardTitleDark,
                    ]}
                  >
                    {tapToPlayLabel}
                  </Text>
                  <View style={[styles.goButton, index === 0 && styles.goButtonLight]}>
                    <Text style={[styles.goText, index === 0 && styles.goTextLight]}>GO</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heading: {
    gap: 6,
    marginTop: 0,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 32,
  },
  subtitle: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  tipBanner: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  tipText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 16,
  },
  grid: {
    gap: 14,
    paddingBottom: 8,
  },
  cardPressable: {
    width: "100%",
  },
  card: {
    height: 236,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardPrimary: {
    backgroundColor: appColors.primary,
    borderColor: "rgba(231, 211, 26, 0.28)",
  },
  cardNeutral: {
    backgroundColor: appColors.surfaceAlt,
    borderColor: appColors.ice,
  },
  cardContent: {
    height: "100%",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  cardIndex: {
    color: "rgba(244, 244, 239, 0.20)",
    fontSize: 26,
    lineHeight: 30,
    fontFamily: fontFamilies.displayBold,
  },
  cardIndexActive: {
    color: "rgba(9, 10, 13, 0.16)",
  },
  cardAccent: {
    width: 62,
    height: 8,
    borderRadius: 999,
  },
  cardAccentLight: {
    backgroundColor: appColors.white,
  },
  cardAccentDark: {
    backgroundColor: appColors.primary,
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    maxWidth: 190,
    paddingTop: 2,
  },
  cardTitleLight: {
    color: appColors.primaryDeep,
  },
  cardTitleDark: {
    color: appColors.ink,
  },
  cardDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 200,
  },
  cardDescriptionLight: {
    color: "rgba(9, 10, 13, 0.76)",
  },
  cardDescriptionDark: {
    color: "rgba(244, 244, 239, 0.74)",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCta: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  goButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  goButtonLight: {
    backgroundColor: appColors.primaryDeep,
  },
  goText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
  },
  goTextLight: {
    color: appColors.primary,
  },
});
