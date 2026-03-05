import { StyleSheet, View } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type NameSetupScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  helper: string;
  continueLabel: string;
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const inputProps = {
  textColor: appColors.white,
  placeholderTextColor: appColors.muted,
  selectionColor: appColors.primary,
};

export const NameSetupScreen = ({
  eyebrow,
  title,
  subtitle,
  nameLabel,
  helper,
  continueLabel,
  value,
  isSaving,
  onChange,
  onSubmit,
}: NameSetupScreenProps) => (
  <View style={styles.container}>
    <View style={styles.topMarker} />
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <TextInput
          {...inputProps}
          mode="flat"
          label={nameLabel}
          value={value}
          onChangeText={onChange}
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
          onPress={onSubmit}
          disabled={!value.trim() || isSaving}
          contentStyle={styles.buttonContent}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          {continueLabel}
        </Button>
      </Card.Content>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: appSpacing.xl2,
  },
  topMarker: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: appColors.primary,
    alignSelf: "flex-end",
  },
  card: {
    borderRadius: appRadii.mega,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  content: {
    gap: appSpacing.xl,
    paddingVertical: appSpacing.md2,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
