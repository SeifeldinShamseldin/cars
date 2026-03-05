import {
  Keyboard,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Button, Card, Chip, HelperText, Text, TextInput } from "react-native-paper";

import { BackArrow } from "../../../../shared/components/BackArrow";
import { appColors } from "../../../../shared/theme/paperTheme";
import { appRadii, appSpacing, withAlpha } from "../../../../shared/theme/tokens";
import { fontFamilies } from "../../../../shared/theme/typography";

type GameEntryScreenProps = {
  eyebrow: string;
  title: string;
  note: string;
  createNewRoomLabel: string;
  joinExistingRoomLabel: string;
  roomCodeLabel: string;
  joinHelper: string;
  createLabel: string;
  joinLabel: string;
  backLabel: string;
  roomCode: string;
  onChangeRoomCode: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
  onJoin: () => void;
};

export const GameEntryScreen = ({
  eyebrow,
  title,
  note,
  createNewRoomLabel,
  joinExistingRoomLabel,
  roomCodeLabel,
  joinHelper,
  createLabel,
  joinLabel,
  backLabel,
  roomCode,
  onChangeRoomCode,
  onBack,
  onCreate,
  onJoin,
}: GameEntryScreenProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <BackArrow label={backLabel} onPress={onBack} />
      <Card mode="elevated" style={styles.heroCard}>
        <Card.Content style={styles.hero}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
          <Text style={styles.subtitle}>{note}</Text>
          <Chip compact style={styles.modeChip}>
            {joinExistingRoomLabel}
          </Chip>
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.joinBlock}>
        <Card.Content style={styles.blockContent}>
          <Text style={styles.blockLabel}>{joinExistingRoomLabel}</Text>
          <TextInput
            mode="flat"
            label={roomCodeLabel}
            value={roomCode}
            autoCapitalize="characters"
            onChangeText={(value) => onChangeRoomCode(value.toUpperCase())}
            maxLength={5}
            style={styles.input}
            underlineColor="transparent"
            activeUnderlineColor={appColors.primary}
          />
          <HelperText type="info" style={styles.helper}>
            {joinHelper}
          </HelperText>
          <Button
            mode="contained-tonal"
            onPress={onJoin}
            disabled={!roomCode.trim()}
            contentStyle={styles.secondaryButtonContent}
            style={styles.secondaryButton}
          >
            {joinLabel}
          </Button>
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.actionBlock}>
        <Card.Content style={styles.blockContent}>
          <Text style={styles.blockLabel}>{createNewRoomLabel}</Text>
          <Text style={styles.createHint}>{note}</Text>
          <Button
            mode="contained"
            onPress={onCreate}
            contentStyle={styles.primaryButtonContent}
            style={styles.primaryButton}
          >
            {createLabel}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  screen: {
    gap: appSpacing.xl2,
    paddingTop: appSpacing.md2,
    paddingBottom: appSpacing.md,
  },
  heroCard: {
    borderRadius: appRadii.mega,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  hero: {
    gap: appSpacing.md2,
    minHeight: 210,
    justifyContent: "flex-end",
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    color: appColors.ink,
    fontSize: 42,
    lineHeight: 44,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    maxWidth: 220,
  },
  titleCompact: {
    fontSize: 36,
    lineHeight: 38,
  },
  subtitle: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 280,
  },
  modeChip: {
    alignSelf: "flex-start",
    backgroundColor: withAlpha(appColors.primary, 0.14),
  },
  actionBlock: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  joinBlock: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: withAlpha(appColors.white, 0.06),
  },
  blockContent: {
    gap: appSpacing.lg,
  },
  blockLabel: {
    color: appColors.ink,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fontFamilies.displayBold,
  },
  input: {
    backgroundColor: withAlpha(appColors.white, 0.02),
    borderRadius: appRadii.xl,
  },
  helper: {
    color: appColors.inkSoft,
    marginLeft: 0,
  },
  createHint: {
    color: appColors.inkSoft,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.primary,
  },
  primaryButtonContent: {
    minHeight: 58,
  },
  secondaryButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surface,
  },
  secondaryButtonContent: {
    minHeight: 54,
  },
});
