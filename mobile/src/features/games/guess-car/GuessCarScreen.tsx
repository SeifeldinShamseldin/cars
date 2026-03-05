import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import type {
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
} from "../../../../shared/types/domain";
import { CountdownPill } from "../../../shared/components/CountdownPill";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type GuessCarScreenProps = {
  payload?: GuessCarRoundStartedPayload;
  roundEndsAt?: number;
  isHost: boolean;
  selectedOptionId?: string;
  disabled: boolean;
  results?: GuessCarRoundEndedResults;
  roomClosesAt?: number;
  eyebrow: string;
  roundTitle: string;
  exitGameLabel: string;
  rematchLabel: string;
  leaveRoomLabel: string;
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
  onExitGame: () => void;
  onRematchGame: () => void;
  onLeaveRoom: () => void;
  onSelectOption: (optionId: string) => void;
  onSubmitOption: (optionId: string) => void;
};

export const GuessCarScreen = ({
  payload,
  roundEndsAt,
  isHost,
  selectedOptionId,
  disabled,
  results,
  roomClosesAt,
  eyebrow,
  roundTitle,
  exitGameLabel,
  rematchLabel,
  leaveRoomLabel,
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
  onExitGame,
  onRematchGame,
  onLeaveRoom,
  onSelectOption,
  onSubmitOption,
}: GuessCarScreenProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const imageHeight = isCompact ? 190 : 220;

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
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              {results.winnerNickname
                ? winnerLabel.replace("{name}", results.winnerNickname)
                : noWinnerLabel}
            </Text>
            <View style={styles.resultMeta}>
              <Chip compact style={styles.resultChip}>
                {correctOptionLabel.replace("{value}", results.correctOptionId)}
              </Chip>
              <Chip compact style={styles.resultChip}>
                {answeredPlayersLabel.replace("{count}", String(results.answeredCount))}
              </Chip>
            </View>
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
            <View style={styles.footerActions}>
              {roomClosesAt ? (
                <Button
                mode="contained"
                onPress={onRematchGame}
                style={styles.rematchButton}
                contentStyle={styles.exitButtonContent}
                labelStyle={styles.rematchButtonLabel}
                >
                  {rematchLabel}
                </Button>
              ) : null}
              {roomClosesAt ? (
                <Button
                  mode="outlined"
                  onPress={onLeaveRoom}
                  style={styles.leaveButton}
                  labelStyle={styles.leaveButtonLabel}
                >
                  {leaveRoomLabel}
                </Button>
              ) : null}
            </View>
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
          <Text style={[styles.title, isCompact && styles.titleCompact]}>{roundTitle}</Text>

          {payload.mode === "CLUE" ? (
            <View style={styles.clues}>
              <View style={styles.clueCard}>
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
            </View>
          ) : (
            <ResponsiveImage
              source={payload.partImageUrl}
              height={imageHeight}
              borderRadius={18}
              backgroundColor={appColors.surfaceAlt}
              priority="high"
            />
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
          <Button
            mode="contained"
            onPress={onExitGame}
            style={styles.exitButton}
            contentStyle={styles.exitButtonContent}
            labelStyle={styles.exitButtonLabel}
          >
            {exitGameLabel}
          </Button>
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
  resultMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  resultChip: {
    backgroundColor: appColors.surfaceAlt,
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
  titleCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  clues: {
    gap: 8,
  },
  clueCard: {
    gap: 8,
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clueLine: {
    color: appColors.inkSoft,
    fontSize: 17,
    lineHeight: 22,
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
  exitButton: {
    borderRadius: 18,
    backgroundColor: appColors.danger,
    marginTop: 6,
  },
  footerActions: {
    gap: 10,
    marginTop: 6,
  },
  exitButtonContent: {
    minHeight: 52,
  },
  exitButtonLabel: {
    color: appColors.white,
  },
  rematchButton: {
    borderRadius: 18,
    backgroundColor: appColors.accent,
  },
  rematchButtonLabel: {
    color: appColors.ink,
  },
  leaveButton: {
    borderRadius: 18,
    borderColor: appColors.ice,
  },
  leaveButtonLabel: {
    color: appColors.inkSoft,
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
