import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type SellerAccountScreenProps = {
  title: string;
  subtitle: string;
  sellerNameLabel: string;
  phoneLabel: string;
  sellerTypeLabel: string;
  logoutLabel: string;
  sellerName: string;
  phone: string;
  sellerType: string;
  backLabel: string;
  onBack: () => void;
  onLogout: () => void;
};

export const SellerAccountScreen = ({
  title,
  subtitle,
  sellerNameLabel,
  phoneLabel,
  sellerTypeLabel,
  logoutLabel,
  sellerName,
  phone,
  sellerType,
  onBack,
  onLogout,
}: SellerAccountScreenProps) => (
  <View style={styles.root}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.content}>
          <BackArrow onPress={onBack} />
          <Text style={styles.title}>{title}</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {subtitle}
          </Text>

          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>{sellerNameLabel}</Text>
              <Text style={styles.factValue}>{sellerName}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>{phoneLabel}</Text>
              <Text style={styles.factValue}>{phone}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>{sellerTypeLabel}</Text>
              <Text style={styles.factValue}>{sellerType}</Text>
            </View>
          </View>

          <Button
            mode="contained"
            buttonColor={appColors.danger}
            textColor={appColors.white}
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            onPress={onLogout}
          >
            {logoutLabel}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: appSpacing.lg,
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
  facts: {
    gap: appSpacing.md2,
  },
  fact: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surfaceAlt,
    padding: appSpacing.lg2,
  },
  factLabel: {
    color: appColors.muted,
    fontSize: 12,
    marginBottom: appSpacing.sm,
    textTransform: "uppercase",
  },
  factValue: {
    color: appColors.white,
    fontSize: 18,
    fontFamily: fontFamilies.display,
  },
  logoutButton: {
    marginTop: appSpacing.md,
    borderRadius: appRadii.xl,
  },
  logoutButtonContent: {
    minHeight: 52,
  },
});
