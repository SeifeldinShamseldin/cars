import { StyleSheet } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type ProfileScreenProps = {
  eyebrow: string;
  subtitle: string;
  updateNameLabel: string;
  playerNameLabel: string;
  helper: string;
  saveNameLabel: string;
  currentName: string;
  draftName: string;
  isSaving: boolean;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
};

export const ProfileScreen = ({
  eyebrow,
  subtitle,
  updateNameLabel,
  playerNameLabel,
  helper,
  saveNameLabel,
  currentName,
  draftName,
  isSaving,
  onChangeDraft,
  onSave,
}: ProfileScreenProps) => (
  <>
    <Card mode="elevated" style={styles.heroCard}>
      <Card.Content style={styles.heroContent}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{currentName}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
      </Card.Content>
    </Card>

    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text style={styles.sectionTitle}>{updateNameLabel}</Text>
        <TextInput
          mode="flat"
          label={playerNameLabel}
          value={draftName}
          onChangeText={onChangeDraft}
          maxLength={24}
          style={styles.input}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <HelperText type="info" style={styles.helper}>
          {helper}
        </HelperText>
        <Button
          mode="contained"
          onPress={onSave}
          disabled={!draftName.trim() || isSaving}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {saveNameLabel}
        </Button>
      </Card.Content>
    </Card>
  </>
);

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  heroContent: {
    gap: 10,
    paddingVertical: 12,
    minHeight: 180,
    justifyContent: "flex-end",
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  subtitle: {
    color: appColors.inkSoft,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  content: {
    gap: 14,
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
  input: {
    backgroundColor: appColors.surfaceAlt,
    borderRadius: 18,
  },
  helper: {
    color: appColors.inkSoft,
    marginLeft: 0,
  },
  button: {
    borderRadius: 18,
    backgroundColor: appColors.primary,
  },
  buttonContent: {
    minHeight: 56,
  },
});
