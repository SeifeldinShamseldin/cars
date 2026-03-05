import { StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type SellerAccessChoiceScreenProps = {
  title: string;
  subtitle: string;
  signInLabel: string;
  signUpLabel: string;
  backLabel: string;
  onSignIn: () => void;
  onSignUp: () => void;
  onBack: () => void;
};

export const SellerAccessChoiceScreen = ({
  title,
  subtitle,
  signInLabel,
  signUpLabel,
  backLabel,
  onSignIn,
  onSignUp,
  onBack,
}: SellerAccessChoiceScreenProps) => (
  <Card mode="elevated" style={styles.card}>
    <Card.Content style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        {subtitle}
      </Text>
      <Button
        mode="contained"
        onPress={onSignIn}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {signInLabel}
      </Button>
      <Button
        mode="contained"
        onPress={onSignUp}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {signUpLabel}
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
