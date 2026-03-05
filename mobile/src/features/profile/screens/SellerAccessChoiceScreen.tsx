import { StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
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
  onSignIn,
  onSignUp,
  onBack,
}: SellerAccessChoiceScreenProps) => (
  <Card mode="elevated" style={styles.card}>
    <Card.Content style={styles.content}>
      <BackArrow onPress={onBack} />
      <Text style={styles.title}>{title}</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        {subtitle}
      </Text>
      <Button
        mode="contained"
        onPress={onSignIn}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        {signInLabel}
      </Button>
      <Button
        mode="contained"
        onPress={onSignUp}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        {signUpLabel}
      </Button>
    </Card.Content>
  </Card>
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
