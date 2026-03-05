import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

export type SellerHistoryCard = {
  id: string;
  title: string;
  priceText: string;
  yearText: string;
  statusText: string;
  featuredStateText?: string;
  imageUrl?: string;
  editLabel?: string;
  deleteLabel?: string;
  requestFeatureLabel?: string;
  isDeleting?: boolean;
  isRequestingFeature?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRequestFeature?: () => void;
};

type SellerHistoryScreenProps = {
  title: string;
  subtitle: string;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
  loadingMoreLabel: string;
  backLabel: string;
  statusMessage?: string;
  cards: SellerHistoryCard[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onBack: () => void;
};

const HistoryCard = ({
  title,
  priceText,
  yearText,
  statusText,
  featuredStateText,
  imageUrl,
  editLabel,
  deleteLabel,
  requestFeatureLabel,
  isDeleting,
  isRequestingFeature,
  onEdit,
  onDelete,
  onRequestFeature,
}: SellerHistoryCard) => (
  <Card mode="elevated" style={styles.card}>
    <Card.Content style={styles.cardContent}>
      {imageUrl ? (
        <ResponsiveImage
          source={imageUrl}
          height={160}
          borderRadius={appRadii.xl}
          contentFit="cover"
          backgroundColor={appColors.surfaceAlt}
        />
      ) : null}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardPrice}>{priceText}</Text>
        </View>
        <Chip style={styles.yearChip}>{yearText}</Chip>
      </View>
      <View style={styles.metaRow}>
        <Chip style={styles.metaChip}>{statusText}</Chip>
        {featuredStateText ? <Chip style={styles.metaChip}>{featuredStateText}</Chip> : null}
      </View>
      <View style={styles.actionRow}>
        {editLabel && onEdit ? (
          <Button
            mode="outlined"
            onPress={onEdit}
            style={styles.secondaryActionButton}
            labelStyle={styles.secondaryActionButtonLabel}
          >
            {editLabel}
          </Button>
        ) : null}
        {deleteLabel && onDelete ? (
          <Button
            mode="outlined"
            onPress={onDelete}
            disabled={isDeleting}
            style={styles.deleteActionButton}
            labelStyle={styles.deleteActionButtonLabel}
          >
            {deleteLabel}
          </Button>
        ) : null}
      </View>
      {requestFeatureLabel && onRequestFeature ? (
        <Button
          mode="contained"
          onPress={onRequestFeature}
          disabled={isRequestingFeature}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        >
          {requestFeatureLabel}
        </Button>
      ) : null}
    </Card.Content>
  </Card>
);

export const SellerHistoryScreen = ({
  title,
  subtitle,
  loadingLabel,
  errorLabel,
  emptyLabel,
  loadingMoreLabel,
  statusMessage,
  cards,
  isLoading,
  isLoadingMore,
  hasError,
  hasMore,
  onLoadMore,
  onBack,
}: SellerHistoryScreenProps) => {
  const footer =
    cards.length > 0 ? (
      <View style={styles.footer}>
        {isLoadingMore ? (
          <Text style={styles.footerLabel}>{loadingMoreLabel}</Text>
        ) : hasMore ? (
          <Button mode="text" onPress={onLoadMore}>
            {loadingMoreLabel}
          </Button>
        ) : null}
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <BackArrow onPress={onBack} />

      <Card mode="elevated" style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <Text style={styles.title}>{title}</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {subtitle}
          </Text>
        </Card.Content>
      </Card>

      {statusMessage ? (
        <Text style={styles.statusLabel}>{statusMessage}</Text>
      ) : null}

      {hasError && cards.length > 0 ? (
        <Text style={styles.errorLabel}>{errorLabel}</Text>
      ) : null}

      {isLoading && cards.length === 0 ? (
        <Text style={styles.stateLabel}>{loadingLabel}</Text>
      ) : hasError && cards.length === 0 ? (
        <Text style={styles.stateLabel}>{errorLabel}</Text>
      ) : cards.length === 0 ? (
        <Text style={styles.stateLabel}>{emptyLabel}</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard {...item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              onLoadMore();
            }
          }}
          ListFooterComponent={footer}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: appSpacing.xl,
  },
  heroCard: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  heroContent: {
    gap: appSpacing.md2,
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
  stateLabel: {
    color: appColors.muted,
    lineHeight: 22,
  },
  statusLabel: {
    color: appColors.muted,
    lineHeight: 22,
  },
  errorLabel: {
    color: appColors.danger,
    lineHeight: 22,
  },
  listContent: {
    gap: appSpacing.lg2,
    paddingBottom: appSpacing.lg,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  cardContent: {
    gap: appSpacing.lg2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: appSpacing.lg,
  },
  cardHeaderText: {
    flex: 1,
    gap: appSpacing.sm,
  },
  cardTitle: {
    color: appColors.white,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamilies.displayBold,
  },
  cardPrice: {
    color: appColors.primary,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.display,
  },
  yearChip: {
    backgroundColor: appColors.surfaceAlt,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md,
  },
  metaChip: {
    backgroundColor: appColors.surfaceAlt,
  },
  actionButton: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.white,
  },
  actionButtonContent: {
    minHeight: 50,
  },
  actionButtonLabel: {
    color: appColors.inkDark,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md2,
  },
  secondaryActionButton: {
    borderRadius: appRadii.lg,
    borderColor: appColors.border,
  },
  secondaryActionButtonLabel: {
    color: appColors.white,
  },
  deleteActionButton: {
    borderRadius: appRadii.lg,
    borderColor: appColors.danger,
  },
  deleteActionButtonLabel: {
    color: appColors.danger,
  },
  footer: {
    alignItems: "center",
    paddingTop: appSpacing.sm,
  },
  footerLabel: {
    color: appColors.muted,
  },
});
