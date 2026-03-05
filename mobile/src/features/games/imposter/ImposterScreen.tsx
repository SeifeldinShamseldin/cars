import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import type {
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
} from "../../../../shared/types/domain";
import { CountdownPill } from "../../../shared/components/CountdownPill";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type ImposterScreenProps = {
  payload?: ImposterRoundStartedPayload;
  roundEndsAt?: number;
  isHost: boolean;
  results?: ImposterRoundEndedResults;
  roomClosesAt?: number;
  eyebrow: string;
  roundTitle: string;
  exitGameLabel: string;
  rematchLabel: string;
  leaveRoomLabel: string;
  waitingLabel: string;
  timeLeftLabel: string;
  roomClosesLabel: string;
  imposterRevealLabel: string;
  normalImageLabel: string;
  imposterImageLabel: string;
  onExitGame: () => void;
  onRematchGame: () => void;
  onLeaveRoom: () => void;
};

export const ImposterScreen = ({
  payload,
  roundEndsAt,
  isHost,
  results,
  roomClosesAt,
  eyebrow,
  roundTitle,
  exitGameLabel,
  rematchLabel,
  leaveRoomLabel,
  waitingLabel,
  timeLeftLabel,
  roomClosesLabel,
  imposterRevealLabel,
  normalImageLabel,
  imposterImageLabel,
  onExitGame,
  onRematchGame,
  onLeaveRoom,
}: ImposterScreenProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const imageHeight = isCompact ? 190 : 230;

  return (
  <>
    <Card mode="elevated" style={styles.heroCard}>
      <Card.Content style={styles.heroSection}>
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {roundEndsAt ? (
            <CountdownPill targetTime={roundEndsAt} label={timeLeftLabel} />
          ) : null}
        </View>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{roundTitle}</Text>
        {payload ? (
          <>
            <ResponsiveImage
              source={payload.imageUrl}
              height={imageHeight}
              borderRadius={18}
              priority="high"
            />
            <View style={styles.promptCard}>
              <Text variant="bodyLarge" style={styles.prompt}>
                {payload.prompt}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.promptCard}>
            <Text variant="bodyLarge" style={styles.prompt}>
              {waitingLabel}
            </Text>
          </View>
        )}
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

    {results ? (
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text style={styles.sectionTitle}>
            {imposterRevealLabel.replace("{name}", results.imposterNickname)}
          </Text>
          <Chip compact style={styles.metaChip}>
            {normalImageLabel}
          </Chip>
          <ResponsiveImage
            source={results.normalCarImageUrl}
            height={imageHeight}
            borderRadius={18}
            priority="high"
          />
          <Chip compact style={styles.metaChip}>
            {imposterImageLabel}
          </Chip>
          <ResponsiveImage
            source={results.imposterCarImageUrl}
            height={imageHeight}
            borderRadius={18}
            priority="high"
          />
          {roomClosesAt ? (
            <CountdownPill targetTime={roomClosesAt} label={roomClosesLabel} />
          ) : null}
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
    ) : null}
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
    minHeight: 230,
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
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 4,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 34,
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
  promptCard: {
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prompt: {
    color: appColors.inkSoft,
    lineHeight: 22,
  },
  metaChip: {
    alignSelf: "flex-start",
    backgroundColor: appColors.surfaceAlt,
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
});
