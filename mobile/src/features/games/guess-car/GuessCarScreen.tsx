import { StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { Image } from "expo-image";

import type {
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
} from "../../../../shared/types/domain";
import { CountdownPill } from "../../../shared/components/CountdownPill";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type GuessCarScreenProps = {
  payload?: GuessCarRoundStartedPayload;
  round: number;
  roundEndsAt?: number;
  selectedOptionId?: string;
  disabled: boolean;
  results?: GuessCarRoundEndedResults;
  roomClosesAt?: number;
  eyebrow: string;
  roundTitle: string;
  chooseOptionLabel: string;
  submittedLabel: string;
  waitingLabel: string;
  timeLeftLabel: string;
  roomClosesLabel: string;
  winnerLabel: string;
  noWinnerLabel: string;
  correctOptionLabel: string;
  answeredPlayersLabel: string;
  leaderboardLabel: string;
  roundPointsLabel: string;
  totalPointsLabel: string;
  countryLabel: string;
  ccLabel: string;
  hpLabel: string;
  torqueLabel: string;
  specialLabel: string;
  noSpecialLabel: string;
  onSelectOption: (optionId: string) => void;
  onSubmitOption: (optionId: string) => void;
};

export const GuessCarScreen = ({
  payload,
  round,
  roundEndsAt,
  selectedOptionId,
  disabled,
  results,
  roomClosesAt,
  eyebrow,
  roundTitle,
  chooseOptionLabel,
  submittedLabel,
  waitingLabel,
  timeLeftLabel,
  roomClosesLabel,
  winnerLabel,
  noWinnerLabel,
  correctOptionLabel,
  answeredPlayersLabel,
  leaderboardLabel,
  roundPointsLabel,
  totalPointsLabel,
  countryLabel,
  ccLabel,
  hpLabel,
  torqueLabel,
  specialLabel,
  noSpecialLabel,
  onSelectOption,
  onSubmitOption,
}: GuessCarScreenProps) => {
  if (!payload) {
    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text style={styles.waitingTitle}>{waitingLabel}</Text>
          {roomClosesAt ? (
            <CountdownPill targetTime={roomClosesAt} label={roomClosesLabel} />
          ) : null}
        </Card.Content>
      </Card>
    );
  }

  if (results) {
    return (
      <>
        <Card mode="elevated" style={styles.heroCard}>
          <Card.Content style={styles.heroSection}>
            <View style={styles.topRow}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              {roomClosesAt ? (
                <CountdownPill targetTime={roomClosesAt} label={roomClosesLabel} />
              ) : null}
            </View>
            <Text style={styles.title}>
              {results.winnerNickname
                ? winnerLabel.replace("{name}", results.winnerNickname)
                : noWinnerLabel}
            </Text>
            <Text style={styles.clueLine}>
              {correctOptionLabel.replace("{value}", results.correctOptionId)}
            </Text>
            <Text style={styles.clueLine}>
              {answeredPlayersLabel.replace("{count}", String(results.answeredCount))}
            </Text>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Content style={styles.section}>
            <Text style={styles.sectionTitle}>{leaderboardLabel}</Text>
            {results.standings.map((entry, index) => (
              <View key={entry.playerId} style={styles.standingRow}>
                <View style={styles.standingLeft}>
                  <Text style={styles.standingRank}>#{index + 1}</Text>
                  <View style={styles.standingCopy}>
                    <Text style={styles.standingName}>{entry.nickname}</Text>
                    <Text style={styles.standingMeta}>
                      {roundPointsLabel.replace("{count}", String(entry.roundPoints))}
                    </Text>
                  </View>
                </View>
                <Text style={styles.standingScore}>
                  {totalPointsLabel.replace("{count}", String(entry.totalPoints))}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card mode="elevated" style={styles.heroCard}>
        <Card.Content style={styles.heroSection}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <CountdownPill targetTime={roundEndsAt} label={timeLeftLabel} />
          </View>
          <Text style={styles.title}>{roundTitle}</Text>

          {payload.mode === "CLUE" ? (
            <View style={styles.clues}>
              <Text style={styles.clueLine}>
                {countryLabel.replace("{value}", payload.clue.country ?? "-")}
              </Text>
              <Text style={styles.clueLine}>
                {ccLabel.replace("{value}", String(payload.clue.cc ?? "-"))}
              </Text>
              <Text style={styles.clueLine}>
                {hpLabel.replace("{value}", String(payload.clue.hp ?? "-"))}
              </Text>
              <Text style={styles.clueLine}>
                {torqueLabel.replace("{value}", String(payload.clue.torque ?? "-"))}
              </Text>
              <Text style={styles.clueLine}>
                {specialLabel.replace("{value}", payload.clue.special ?? noSpecialLabel)}
              </Text>
            </View>
          ) : (
            <Image source={payload.partImageUrl} style={styles.partImage} contentFit="cover" />
          )}
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text style={styles.sectionTitle}>{chooseOptionLabel}</Text>
          {disabled ? <Text style={styles.metaText}>{submittedLabel}</Text> : null}
          {payload.options.map((option) => {
            const isActive = selectedOptionId === option.id;

            return (
              <Button
                key={option.id}
                mode={isActive ? "contained" : "contained-tonal"}
                disabled={disabled}
                style={isActive ? styles.optionActive : styles.optionButton}
                contentStyle={styles.optionContent}
                onPress={() => {
                  onSelectOption(option.id);
                  onSubmitOption(option.id);
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </Card.Content>
      </Card>

    </>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  card: {
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  heroSection: {
    gap: 14,
    minHeight: 226,
    justifyContent: "flex-end",
  },
  section: {
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: appColors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fontFamilies.displayBold,
    flex: 1,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 4,
  },
  clues: {
    gap: 8,
  },
  clueLine: {
    color: appColors.inkSoft,
    fontSize: 17,
    lineHeight: 22,
  },
  partImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
  },
  sectionTitle: {
    color: appColors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 2,
  },
  optionButton: {
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
  },
  optionActive: {
    borderRadius: 18,
    backgroundColor: appColors.primary,
  },
  optionContent: {
    minHeight: 58,
  },
  metaText: {
    color: appColors.inkSoft,
  },
  standingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  standingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  standingRank: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
  },
  standingCopy: {
    gap: 3,
    flex: 1,
  },
  standingName: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
  },
  standingMeta: {
    color: appColors.inkSoft,
    fontSize: 12,
    lineHeight: 14,
  },
  standingScore: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  waitingTitle: {
    color: appColors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 2,
  },
});
