import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from "react-native-paper";

import type { SellerType } from "../../../shared/api/catalog";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type SellerSignupScreenProps = {
  title: string;
  subtitle: string;
  nameLabel: string;
  phoneLabel: string;
  pinLabel: string;
  confirmPinLabel: string;
  sellerTypeLabel: string;
  ownerLabel: string;
  dealerLabel: string;
  saveLabel: string;
  backLabel: string;
  nameValue: string;
  phoneValue: string;
  pinValue: string;
  confirmPinValue: string;
  sellerType: SellerType;
  isSubmitting: boolean;
  errorMessage?: string;
  onChangeName: (value: string) => void;
  onChangePhone: (value: string) => void;
  onChangePin: (value: string) => void;
  onChangeConfirmPin: (value: string) => void;
  onChangeSellerType: (value: SellerType) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export const SellerSignupScreen = ({
  title,
  subtitle,
  nameLabel,
  phoneLabel,
  pinLabel,
  confirmPinLabel,
  sellerTypeLabel,
  ownerLabel,
  dealerLabel,
  saveLabel,
  backLabel,
  nameValue,
  phoneValue,
  pinValue,
  confirmPinValue,
  sellerType,
  isSubmitting,
  errorMessage,
  onChangeName,
  onChangePhone,
  onChangePin,
  onChangeConfirmPin,
  onChangeSellerType,
  onSubmit,
  onBack,
}: SellerSignupScreenProps) => (
  <Pressable onPress={Keyboard.dismiss}>
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <TextInput
          mode="flat"
          label={nameLabel}
          value={nameValue}
          onChangeText={onChangeName}
          style={styles.input}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
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
        <TextInput
          mode="flat"
          label={confirmPinLabel}
          value={confirmPinValue}
          onChangeText={onChangeConfirmPin}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <View style={styles.segmentedSection}>
          <Text style={styles.segmentedLabel}>{sellerTypeLabel}</Text>
          <SegmentedButtons
            value={sellerType}
            onValueChange={(value) => onChangeSellerType(value as SellerType)}
            buttons={[
              { value: "OWNER", label: ownerLabel },
              { value: "DEALER", label: dealerLabel },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        <HelperText type={errorMessage ? "error" : "info"} style={styles.helper}>
          {errorMessage ?? " "}
        </HelperText>
        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={
            !nameValue.trim() ||
            !phoneValue.trim() ||
            !pinValue.trim() ||
            !confirmPinValue.trim() ||
            isSubmitting
          }
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {saveLabel}
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
  segmentedSection: {
    gap: 10,
  },
  segmentedLabel: {
    color: appColors.ink,
    fontSize: 16,
    fontFamily: fontFamilies.display,
  },
  segmentedButtons: {
    backgroundColor: appColors.surfaceAlt,
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
