import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type ProfileScreenProps = {
  eyebrow: string;
  subtitle: string;
  updateNameLabel: string;
  playerNameLabel: string;
  helper: string;
  saveNameLabel: string;
  becomeSellerLabel: string;
  postCarLabel?: string;
  historyLabel?: string;
  sellerStateLabel?: string;
  isBecomeSellerDisabled?: boolean;
  isPostCarDisabled?: boolean;
  isHistoryDisabled?: boolean;
  currentName: string;
  draftName: string;
  isSaving: boolean;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onBecomeSeller: () => void;
  onPostCar?: () => void;
  onHistory?: () => void;
};

const inputProps = {
  textColor: appColors.white,
  placeholderTextColor: appColors.muted,
  selectionColor: appColors.primary,
};

export const ProfileScreen = ({
  eyebrow,
  subtitle,
  updateNameLabel,
  playerNameLabel,
  helper,
  saveNameLabel,
  becomeSellerLabel,
  postCarLabel,
  historyLabel,
  sellerStateLabel,
  isBecomeSellerDisabled = false,
  isPostCarDisabled = false,
  isHistoryDisabled = false,
  currentName,
  draftName,
  isSaving,
  onChangeDraft,
  onSave,
  onBecomeSeller,
  onPostCar,
  onHistory,
}: ProfileScreenProps) => (
  <View style={styles.root}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
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
            {...inputProps}
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
            labelStyle={styles.buttonLabel}
          >
            {saveNameLabel}
          </Button>
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.sectionTitle}>{becomeSellerLabel}</Text>
          {sellerStateLabel ? (
            <HelperText type="info" style={styles.helper}>
              {sellerStateLabel}
            </HelperText>
          ) : null}
          <Button
            mode="contained"
            onPress={onBecomeSeller}
            disabled={isBecomeSellerDisabled}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {becomeSellerLabel}
          </Button>
          <View style={styles.sellerActions}>
            {postCarLabel && onPostCar ? (
              <Button
                mode="contained"
                onPress={onPostCar}
                disabled={isPostCarDisabled}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {postCarLabel}
              </Button>
            ) : null}
            {historyLabel && onHistory ? (
              <Button
                mode="contained"
                onPress={onHistory}
                disabled={isHistoryDisabled}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {historyLabel}
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: appSpacing.xxl,
    paddingBottom: 140,
  },
  heroCard: {
    borderRadius: appRadii.mega,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  heroContent: {
    gap: appSpacing.md2,
    paddingVertical: appSpacing.lg,
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
    color: appColors.white,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 4,
  },
  subtitle: {
    color: appColors.muted,
    lineHeight: 22,
  },
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  content: {
    gap: appSpacing.lg2,
  },
  sectionTitle: {
    color: appColors.white,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 2,
  },
  input: {
    backgroundColor: appColors.inputBg,
    borderWidth: 1,
    borderColor: appColors.inputBorder,
    borderRadius: appRadii.xl,
  },
  helper: {
    color: appColors.muted,
    marginLeft: 0,
  },
  sellerActions: {
    gap: appSpacing.lg2,
  },
  button: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.white,
  },
  buttonContent: {
    minHeight: 56,
  },
  buttonLabel: {
    color: appColors.inkDark,
  },
});
