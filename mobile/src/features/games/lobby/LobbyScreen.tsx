import { StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import type { RoomStatePublic } from "../../../../shared/types/domain";
import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type LobbyScreenProps = {
  roomState: RoomStatePublic;
  isHost: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  activeModeLabel: string;
  playersLabel: string;
  hostLabel: string;
  hostControlsLabel: string;
  waitingHostLabel: string;
  startRoundsLabel: string;
  waitingText: string;
  leaveRoomLabel: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
};

export const LobbyScreen = ({
  roomState,
  isHost,
  eyebrow,
  title,
  subtitle,
  activeModeLabel,
  playersLabel,
  hostLabel,
  hostControlsLabel,
  waitingHostLabel,
  startRoundsLabel,
  waitingText,
  leaveRoomLabel,
  onStartGame,
  onLeaveRoom,
}: LobbyScreenProps) => (
    <>
      <BackArrow label={leaveRoomLabel} onPress={onLeaveRoom} />
      <View style={styles.heroSection}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <Chip compact style={styles.modeChip}>
          {activeModeLabel}
        </Chip>
      </View>

      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text style={styles.sectionTitle}>{playersLabel}</Text>
          {roomState.players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <Text variant="bodyLarge" style={styles.playerName}>
                {player.nickname}
              </Text>
              {roomState.hostId === player.id ? (
                <Chip compact style={styles.hostChip}>
                  {hostLabel}
                </Chip>
              ) : null}
            </View>
          ))}

          <View style={styles.divider} />

          {isHost ? (
            <>
              <Text style={styles.sectionTitle}>{hostControlsLabel}</Text>
              <Button
                mode="contained"
                onPress={onStartGame}
                disabled={roomState.gameType === "NONE"}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                {startRoundsLabel}
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{waitingHostLabel}</Text>
              <Text variant="bodyMedium" style={styles.waitingText}>
                {waitingText}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
    </>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  heroSection: {
    gap: appSpacing.md2,
    paddingTop: appSpacing.lg,
  },
  section: {
    gap: appSpacing.lg2,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: appColors.ink,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 4,
  },
  subtitle: {
    color: appColors.inkSoft,
  },
  modeChip: {
    alignSelf: "flex-start",
    backgroundColor: withAlpha(appColors.primary, 0.14),
  },
  sectionTitle: {
    color: appColors.ink,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: appColors.ice,
    marginVertical: 2,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  playerName: {
    color: appColors.ink,
  },
  hostChip: {
    backgroundColor: appColors.surfaceAlt,
  },
  buttonContent: {
    minHeight: 54,
  },
  primaryButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.primary,
  },
  waitingText: {
    color: appColors.inkSoft,
  },
});
