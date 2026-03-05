import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "react-native-paper";

import type {
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
} from "../../../../shared/types/domain";
import { CountdownPill } from "../../../shared/components/CountdownPill";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../shared/theme/tokens";
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

  // ── Waiting state ──────────────────────────────────────────────────────────
  if (!payload) {
    return (
      <View style={styles.card}>
        <Text style={styles.waitingTitle}>{waitingLabel}</Text>
        {roomClosesAt ? (
          <CountdownPill targetTime={roomClosesAt} label={roomClosesLabel} />
        ) : null}
      </View>
    );
  }

  // ── Results state ──────────────────────────────────────────────────────────
  if (results) {
    return (
      <>
        {/* Winner hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroWatermark} numberOfLines={1}>
            {results.winnerNickname ?? "—"}
          </Text>
          <View style={styles.heroContent}>
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
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {correctOptionLabel.replace("{value}", results.correctOptionId)}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {answeredPlayersLabel.replace("{count}", String(results.answeredCount))}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leaderboard card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{leaderboardLabel}</Text>

          {results.standings.map((entry, index) => (
            <View
              key={entry.playerId}
              style={[styles.standingRow, index === 0 && styles.standingRowFirst]}
            >
              <View style={styles.standingLeft}>
                <Text style={[styles.standingRank, index === 0 && styles.standingRankFirst]}>
                  #{index + 1}
                </Text>
                <View style={styles.standingCopy}>
                  <Text style={styles.standingName}>{entry.nickname}</Text>
                  <Text style={styles.standingMeta}>
                    {roundPointsLabel.replace("{count}", String(entry.roundPoints))}
                  </Text>
                </View>
              </View>
              <Text style={[styles.standingScore, index === 0 && styles.standingScoreFirst]}>
                {totalPointsLabel.replace("{count}", String(entry.totalPoints))}
              </Text>
            </View>
          ))}

          <View style={styles.footerActions}>
            {roomClosesAt ? (
              <Pressable style={styles.rematchButton} onPress={onRematchGame}>
                <Text style={styles.rematchButtonText}>{rematchLabel}</Text>
              </Pressable>
            ) : null}
            {roomClosesAt ? (
              <Pressable style={styles.leaveButton} onPress={onLeaveRoom}>
                <Text style={styles.leaveButtonText}>{leaveRoomLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </>
    );
  }

  // ── Active round ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero — clue or image */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <CountdownPill targetTime={roundEndsAt} label={timeLeftLabel} />
          </View>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>{roundTitle}</Text>

          {payload.mode === "CLUE" ? (
            <View style={styles.clueCard}>
              {[
                countryLabel.replace("{value}", payload.clue.country ?? "—"),
                ccLabel.replace("{value}", String(payload.clue.cc ?? "—")),
                hpLabel.replace("{value}", String(payload.clue.hp ?? "—")),
                torqueLabel.replace("{value}", String(payload.clue.torque ?? "—")),
                specialLabel.replace("{value}", payload.clue.special ?? noSpecialLabel),
              ].map((line, i) => (
                <View key={i} style={styles.clueRow}>
                  <View style={styles.clueDot} />
                  <Text style={styles.clueLine}>{line}</Text>
                </View>
              ))}
            </View>
          ) : (
            <ResponsiveImage
              source={payload.partImageUrl}
              height={imageHeight}
              borderRadius={18}
              backgroundColor={appColors.surfaceMuted}
              priority="high"
            />
          )}
        </View>
      </View>

      {/* Options card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{chooseOptionLabel}</Text>

        {disabled ? (
          <View style={styles.submittedBanner}>
            <Text style={styles.submittedText}>{submittedLabel}</Text>
          </View>
        ) : null}

        {payload.options.map((option) => {
          const isActive = selectedOptionId === option.id;
          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              style={[
                styles.optionButton,
                isActive && styles.optionButtonActive,
                disabled && !isActive && styles.optionButtonDisabled,
              ]}
              onPress={() => {
                onSelectOption(option.id);
                onSubmitOption(option.id);
              }}
            >
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable style={styles.exitButton} onPress={onExitGame}>
          <Text style={styles.exitButtonText}>{exitGameLabel}</Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: appRadii.mega,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
    overflow: "hidden",
    minHeight: 226,
    justifyContent: "flex-end",
  },
  heroWatermark: {
    position: "absolute",
    bottom: -14,
    left: -4,
    right: -4,
    color: appColors.white,
    opacity: 0.04,
    fontFamily: fontFamilies.displayBold,
    fontSize: 88,
    lineHeight: 88,
    textTransform: "uppercase",
    letterSpacing: -3,
  },
  heroContent: {
    gap: appSpacing.lg2,
    padding: appSpacing.xxl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: appSpacing.lg,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
    lineHeight: 14,
  },
  title: {
    color: appColors.white,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: -0.5,
    paddingBottom: 4,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md,
  },
  chip: {
    borderRadius: appRadii.pill,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: 7,
  },
  chipText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 12,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Clue card ─────────────────────────────────────────────────────────────
  clueCard: {
    gap: appSpacing.md2,
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: appSpacing.xl,
    paddingVertical: appSpacing.lg2,
  },
  clueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.md2,
  },
  clueDot: {
    width: 6,
    height: 6,
    borderRadius: appRadii.pill,
    backgroundColor: appColors.primary,
    opacity: 0.7,
  },
  clueLine: {
    color: appColors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 21,
  },

  // ── Main card ─────────────────────────────────────────────────────────────
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: appSpacing.xxl,
    gap: appSpacing.lg,
  },
  sectionTitle: {
    color: appColors.white,
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: -0.3,
  },

  // ── Submitted banner ──────────────────────────────────────────────────────
  submittedBanner: {
    borderRadius: appRadii.md,
    backgroundColor: withAlpha(appColors.primary, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(appColors.primary, 0.2),
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submittedText: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Option buttons ────────────────────────────────────────────────────────
  optionButton: {
    borderRadius: appRadii.xl,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.surfaceAlt,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  optionButtonActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  optionButtonDisabled: {
    opacity: 0.4,
  },
  optionText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionTextActive: {
    color: appColors.inkDark,
  },

  // ── Exit button ───────────────────────────────────────────────────────────
  exitButton: {
    borderRadius: appRadii.xl,
    backgroundColor: withAlpha(appColors.dangerBright, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(appColors.dangerBright, 0.2),
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  exitButtonText: {
    color: appColors.dangerBright,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────
  standingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appSpacing.lg,
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: appSpacing.xl,
    paddingVertical: appSpacing.lg2,
  },
  standingRowFirst: {
    backgroundColor: withAlpha(appColors.primary, 0.1),
    borderColor: withAlpha(appColors.primary, 0.22),
  },
  standingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: appSpacing.lg,
    flex: 1,
  },
  standingRank: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
  },
  standingRankFirst: {
    color: appColors.primary,
  },
  standingCopy: {
    gap: 3,
    flex: 1,
  },
  standingName: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
  },
  standingMeta: {
    color: appColors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 14,
  },
  standingScore: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  standingScoreFirst: {
    color: appColors.primary,
  },

  // ── Footer actions ────────────────────────────────────────────────────────
  footerActions: {
    gap: appSpacing.md2,
    marginTop: 4,
  },
  rematchButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.primary,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  rematchButtonText: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  leaveButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveButtonText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Waiting state ─────────────────────────────────────────────────────────
  waitingTitle: {
    color: appColors.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: -0.3,
  },
});
