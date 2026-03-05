import { Keyboard, Pressable, StyleSheet } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
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

export const SellerPinSignInScreen = ({
  title,
  subtitle,
  phoneLabel,
  pinLabel,
  helper,
  signInLabel,
  backLabel,
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
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <TextInput
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
        >
          {signInLabel}
        </Button>
        <Button
          mode="text"
          onPress={onBack}
          style={styles.secondaryButton}
          labelStyle={styles.secondaryButtonLabel}
        >
          {backLabel}
        </Button>
      </Card.Content>
    </Card>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  content: {
    gap: 14,
  },
  title: {
    color: appColors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
  },
  subtitle: {
    color: appColors.inkSoft,
    lineHeight: 22,
  },
  input: {
    backgroundColor: appColors.surfaceAlt,
    borderRadius: 18,
  },
  helper: {
    marginLeft: 0,
  },
  button: {
    borderRadius: 18,
    backgroundColor: appColors.primary,
  },
  buttonContent: {
    minHeight: 56,
  },
  secondaryButton: {
    borderRadius: 18,
  },
  secondaryButtonLabel: {
    color: appColors.inkSoft,
  },
});
