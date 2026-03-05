import { Keyboard, Pressable, StyleSheet } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type SellerPinSignInScreenProps = {
  title: string;
  subtitle: string;
  phoneLabel: string;
  pinLabel: string;
  helper: string;
  signInLabel: string;
  backLabel: string;
  phoneValue: string;
  pinValue: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onChangePhone: (value: string) => void;
  onChangePin: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const inputProps = {
  textColor: appColors.white,
  placeholderTextColor: appColors.muted,
  selectionColor: appColors.primary,
};

export const SellerPinSignInScreen = ({
  title,
  subtitle,
  phoneLabel,
  pinLabel,
  helper,
  signInLabel,
  phoneValue,
  pinValue,
  isSubmitting,
  errorMessage,
  onChangePhone,
  onChangePin,
  onSubmit,
  onBack,
}: SellerPinSignInScreenProps) => (
  <Pressable onPress={Keyboard.dismiss}>
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <TextInput
          {...inputProps}
          mode="flat"
          label={phoneLabel}
          value={phoneValue}
          onChangeText={onChangePhone}
          style={styles.input}
          keyboardType="phone-pad"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <TextInput
          {...inputProps}
          mode="flat"
          label={pinLabel}
          value={pinValue}
          onChangeText={onChangePin}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <HelperText type={errorMessage ? "error" : "info"} style={styles.helper}>
          {errorMessage ?? helper}
        </HelperText>
        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={!phoneValue.trim() || !pinValue.trim() || isSubmitting}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {signInLabel}
        </Button>
      </Card.Content>
    </Card>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  content: {
    gap: appSpacing.lg2,
  },
  title: {
    color: appColors.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
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
