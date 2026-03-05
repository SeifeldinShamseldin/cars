import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from "react-native-paper";

import type { SellerType } from "../../../shared/api/catalog";
import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
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

const inputProps = {
  textColor: appColors.white,
  placeholderTextColor: appColors.muted,
  selectionColor: appColors.primary,
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
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
        <TextInput
          {...inputProps}
          mode="flat"
          label={nameLabel}
          value={nameValue}
          onChangeText={onChangeName}
          style={styles.input}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
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
        <TextInput
          {...inputProps}
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
          labelStyle={styles.buttonLabel}
        >
          {saveLabel}
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
  segmentedSection: {
    gap: appSpacing.md2,
  },
  segmentedLabel: {
    color: appColors.white,
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
