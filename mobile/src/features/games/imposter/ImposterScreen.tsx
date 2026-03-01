import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { Image } from "expo-image";

import type {
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
} from "../../../../shared/types/domain";
import { CountdownPill } from "../../../shared/components/CountdownPill";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

type ImposterScreenProps = {
  payload?: ImposterRoundStartedPayload;
  round: number;
  roundEndsAt?: number;
  results?: ImposterRoundEndedResults;
  roomClosesAt?: number;
  eyebrow: string;
  roundTitle: string;
  waitingLabel: string;
  timeLeftLabel: string;
  roomClosesLabel: string;
  imposterRevealLabel: string;
  normalImageLabel: string;
  imposterImageLabel: string;
};

export const ImposterScreen = ({
  payload,
  round,
  roundEndsAt,
  results,
  roomClosesAt,
  eyebrow,
  roundTitle,
  waitingLabel,
  timeLeftLabel,
  roomClosesLabel,
  imposterRevealLabel,
  normalImageLabel,
  imposterImageLabel,
}: ImposterScreenProps) => (
  <>
    <Card mode="elevated" style={styles.heroCard}>
      <Card.Content style={styles.heroSection}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{roundTitle}</Text>
        <CountdownPill targetTime={roundEndsAt} label={timeLeftLabel} />
        {payload ? (
          <>
            <Image source={payload.imageUrl} style={styles.image} contentFit="cover" />
            <Text variant="bodyLarge" style={styles.prompt}>
              {payload.prompt}
            </Text>
          </>
        ) : (
          <Text variant="bodyLarge" style={styles.prompt}>
            {waitingLabel}
          </Text>
        )}
      </Card.Content>
    </Card>

    {results ? (
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text style={styles.sectionTitle}>
            {imposterRevealLabel.replace("{name}", results.imposterNickname)}
          </Text>
          <Text variant="bodyMedium" style={styles.metaText}>
            {normalImageLabel}
          </Text>
          <Image source={results.normalCarImageUrl} style={styles.image} contentFit="cover" />
          <Text variant="bodyMedium" style={styles.metaText}>
            {imposterImageLabel}
          </Text>
          <Image source={results.imposterCarImageUrl} style={styles.image} contentFit="cover" />
          {roomClosesAt ? (
            <CountdownPill targetTime={roomClosesAt} label={roomClosesLabel} />
          ) : null}
        </Card.Content>
      </Card>
    ) : null}
  </>
);

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  card: {
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  heroSection: {
    gap: 14,
    minHeight: 230,
    justifyContent: "flex-end",
  },
  section: {
    gap: 14,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: appColors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: appColors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.displayBold,
    textTransform: "none",
    paddingTop: 2,
    paddingBottom: 2,
  },
  prompt: {
    color: appColors.inkSoft,
    lineHeight: 22,
  },
  image: {
    width: "100%",
    height: 230,
    borderRadius: 18,
  },
  metaText: {
    color: appColors.inkSoft,
  },
});
