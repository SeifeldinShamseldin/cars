import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
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
  backLabel,
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
          <BackArrow label={backLabel} onPress={onBack} />
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
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
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
  facts: {
    gap: 10,
  },
  fact: {
    borderRadius: 18,
    backgroundColor: appColors.surfaceAlt,
    padding: 14,
  },
  factLabel: {
    color: appColors.inkSoft,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  factValue: {
    color: appColors.ink,
    fontSize: 18,
    fontFamily: fontFamilies.display,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 18,
  },
  logoutButtonContent: {
    minHeight: 52,
  },
});
