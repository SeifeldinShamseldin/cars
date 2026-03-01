import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

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
  return (
    <View style={styles.screen}>
      <BackArrow label={backLabel} onPress={onBack} />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{note}</Text>
      </View>

      <View style={styles.joinBlock}>
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
      </View>

      <View style={styles.actionBlock}>
        <Text style={styles.blockLabel}>{createNewRoomLabel}</Text>
        <Button
          mode="contained"
          onPress={onCreate}
          contentStyle={styles.primaryButtonContent}
          style={styles.primaryButton}
        >
          {createLabel}
        </Button>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 18,
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 8,
  },
  hero: {
    gap: 10,
    paddingTop: 16,
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
  subtitle: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 280,
  },
  actionBlock: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  joinBlock: {
    gap: 10,
    padding: 18,
    borderRadius: 24,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  blockLabel: {
    color: appColors.ink,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fontFamilies.displayBold,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 18,
  },
  helper: {
    color: appColors.inkSoft,
    marginLeft: 0,
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: appColors.primary,
  },
  primaryButtonContent: {
    minHeight: 58,
  },
  secondaryButton: {
    borderRadius: 18,
    backgroundColor: appColors.surface,
  },
  secondaryButtonContent: {
    minHeight: 54,
  },
});
