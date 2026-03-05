import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { appColors } from "../../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../../shared/theme/tokens";
import { fontFamilies } from "../../../../shared/theme/typography";
import type { HubGame } from "../../types";

type GamesHubScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tipLabel: string;
  tapToPlayLabel: string;
  goLabel: string;
  cards: Array<{
    id: HubGame;
    title: string;
    description: string;
  }>;
  onOpenGame: (game: HubGame) => void;
};

export const GamesHubScreen = ({
  eyebrow,
  title,
  subtitle,
  tipLabel,
  tapToPlayLabel,
  goLabel,
  cards,
  onOpenGame,
}: GamesHubScreenProps) => (
  <View style={styles.root}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.tipBanner}>
        <View style={styles.tipAccent} />
        <Text style={styles.tipText}>{tipLabel}</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((game, index) => {
          const isPrimary = index === 0;
          return (
            <Pressable
              key={game.id}
              onPress={() => onOpenGame(game.id)}
              style={styles.cardPressable}
            >
              <View style={[styles.card, isPrimary ? styles.cardPrimary : styles.cardNeutral]}>
                <View style={styles.cardContent}>
                  {/* Top row: accent bar + index number — exactly as original */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.cardAccent, isPrimary ? styles.cardAccentLight : styles.cardAccentYellow]} />
                    <Text style={[styles.cardIndex, isPrimary && styles.cardIndexActive]}>
                      0{index + 1}
                    </Text>
                  </View>

                  <Text style={[styles.cardTitle, isPrimary ? styles.cardTitleDark : styles.cardTitleLight]}>
                    {game.title}
                  </Text>

                  <Text style={[styles.cardDescription, isPrimary ? styles.cardDescDark : styles.cardDescLight]}>
                    {game.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardCta, isPrimary ? styles.cardTitleDark : styles.cardTitleLight]}>
                      {tapToPlayLabel}
                    </Text>
                    <View style={[styles.goButton, isPrimary ? styles.goButtonDark : styles.goButtonYellow]}>
                      <Text style={[styles.goText, isPrimary ? styles.goTextDark : styles.goTextYellow]}>
                        {goLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scroll: {
    flex: 1,
  },
  // Original values preserved exactly
  scrollContent: {
    gap: appSpacing.xl,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heading: {
    gap: appSpacing.sm,
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
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 30,
    lineHeight: 32,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: appColors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  tipBanner: {
    borderRadius: appRadii.xl,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: appSpacing.lg,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.md2,
  },
  tipAccent: {
    width: 4,
    height: 24,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.primary,
  },
  tipText: {
    flex: 1,
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 16,
  },
  grid: {
    gap: appSpacing.lg2,
    paddingBottom: 8,
  },
  cardPressable: {
    width: "100%",
  },
  // Original: height 236, borderRadius 24, overflow hidden, borderWidth 1
  card: {
    height: 236,
    borderRadius: appRadii.xxxl,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardPrimary: {
    backgroundColor: appColors.primary,
    borderColor: withAlpha(appColors.primary, 0.28),
  },
  cardNeutral: {
    backgroundColor: appColors.mutedCard,
    borderColor: appColors.borderStrong,
  },
  // Original: height 100%, gap 12, paddingTop 16, paddingBottom 14
  cardContent: {
    height: "100%",
    gap: appSpacing.lg,
    paddingTop: appSpacing.xl,
    paddingBottom: appSpacing.lg2,
    paddingHorizontal: appSpacing.xl,
  },
  // Original: row, space-between, minHeight 28
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  cardIndex: {
    color: withAlpha(appColors.ink, 0.2),
    fontSize: 26,
    lineHeight: 30,
    fontFamily: fontFamilies.displayBold,
  },
  cardIndexActive: {
    color: withAlpha(appColors.primaryDeep, 0.16),
  },
  cardAccent: {
    width: 62,
    height: 8,
    borderRadius: appRadii.pill,
  },
  cardAccentLight: {
    backgroundColor: withAlpha(appColors.inkDark, 0.25),
  },
  cardAccentYellow: {
    backgroundColor: appColors.primary,
  },
  // Original: fontSize 28, lineHeight 32, maxWidth 190, paddingTop 2
  cardTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: -0.5,
    maxWidth: 190,
    paddingTop: 2,
  },
  cardTitleLight: {
    color: appColors.white,
  },
  cardTitleDark: {
    color: appColors.inkDark,
  },
  // Original: flex 1, fontSize 14, lineHeight 21, maxWidth 200
  cardDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamilies.body,
    maxWidth: 200,
  },
  cardDescLight: {
    color: withAlpha(appColors.white, 0.6),
  },
  cardDescDark: {
    color: withAlpha(appColors.primaryDeep, 0.72),
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
    textTransform: "uppercase",
  },
  // Original: 40x40, borderRadius 14
  goButton: {
    width: 40,
    height: 40,
    borderRadius: appRadii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  goButtonYellow: {
    backgroundColor: appColors.primary,
  },
  goButtonDark: {
    backgroundColor: appColors.inkDark,
  },
  goText: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  goTextYellow: {
    color: appColors.inkDark,
  },
  goTextDark: {
    color: appColors.primary,
  },
});
