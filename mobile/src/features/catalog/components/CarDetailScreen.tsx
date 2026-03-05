import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { prefetchRemoteImages } from "../../../shared/lib/imagePipeline";
import { appColors } from "../../../shared/theme/paperTheme";
import { fontFamilies } from "../../../shared/theme/typography";

export type CarDetailInfoItem = {
  label: string;
  value: string;
  fullWidth?: boolean;
};

export type CarDetailAction = {
  id: string;
  label: string;
  onPress: () => void;
};

type CarDetailScreenProps = {
  isLoading?: boolean;
  hasError?: boolean;
  backLabel: string;
  closeLabel: string;
  loadingLabel: string;
  errorLabel: string;
  eyebrow?: string;
  title?: string;
  priceText?: string;
  year: string;
  typeText?: string;
  description?: string;
  galleryImageUrls: string[];
  infoItems: CarDetailInfoItem[];
  actionButtons?: CarDetailAction[];
  onBack: () => void;
};

export const CarDetailScreen = ({
  isLoading = false,
  hasError = false,
  backLabel,
  closeLabel,
  loadingLabel,
  errorLabel,
  eyebrow,
  title,
  priceText,
  year,
  typeText,
  description,
  galleryImageUrls,
  infoItems,
  actionButtons = [],
  onBack,
}: CarDetailScreenProps) => {
  const { width, height } = useWindowDimensions();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const galleryScrollX = useRef(new Animated.Value(0)).current;
  const galleryScrollRef = useRef<ScrollView>(null);
  const screenHorizontalPadding = 40;
  const heroCardHorizontalPadding = 36;
  const slideWidth = Math.max(width - screenHorizontalPadding - heroCardHorizontalPadding, 240);
  const galleryHeight = Math.min(Math.max(width * 0.74, 280), height * 0.48);
  const modalImageHeight = height * 0.76;
  const paginationStep = 30;
  const loopedGalleryImageUrls = useMemo(
    () =>
      galleryImageUrls.length <= 1
        ? galleryImageUrls
        : [
            galleryImageUrls[galleryImageUrls.length - 1],
            ...galleryImageUrls,
            galleryImageUrls[0],
          ],
    [galleryImageUrls],
  );
  const paginationTranslateX =
    galleryImageUrls.length <= 1
      ? 0
      : galleryScrollX.interpolate({
          inputRange: loopedGalleryImageUrls.map((_, index) => index * slideWidth),
          outputRange: loopedGalleryImageUrls.map(
            (_, index) =>
              (((index - 1) % galleryImageUrls.length) + galleryImageUrls.length) %
              galleryImageUrls.length *
              paginationStep,
          ),
          extrapolate: "clamp",
        });

  useEffect(() => {
    setActiveImageIndex(0);
    setActiveModalImageIndex(0);
  }, [galleryImageUrls]);

  useEffect(() => {
    void prefetchRemoteImages(galleryImageUrls).catch(() => false);
  }, [galleryImageUrls]);

  useEffect(() => {
    if (galleryImageUrls.length <= 1) {
      galleryScrollX.setValue(0);
      setActiveImageIndex(0);
      return;
    }

    requestAnimationFrame(() => {
      galleryScrollRef.current?.scrollTo({ x: slideWidth, animated: false });
      galleryScrollX.setValue(slideWidth);
      setActiveImageIndex(0);
    });
  }, [galleryImageUrls.length, galleryScrollX, slideWidth]);

  const handleGalleryEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);

    if (galleryImageUrls.length <= 1) {
      setActiveImageIndex(0);
      return;
    }

    if (rawIndex === 0) {
      const loopOffset = galleryImageUrls.length * slideWidth;

      requestAnimationFrame(() => {
        galleryScrollRef.current?.scrollTo({ x: loopOffset, animated: false });
        galleryScrollX.setValue(loopOffset);
      });
      setActiveImageIndex(galleryImageUrls.length - 1);
      return;
    }

    if (rawIndex === loopedGalleryImageUrls.length - 1) {
      requestAnimationFrame(() => {
        galleryScrollRef.current?.scrollTo({ x: slideWidth, animated: false });
        galleryScrollX.setValue(slideWidth);
      });
      setActiveImageIndex(0);
      return;
    }

    setActiveImageIndex(rawIndex - 1);
  };

  if (isLoading || !title) {
    return (
      <View style={styles.stateRoot}>
        <Text style={styles.stateText}>{hasError ? errorLabel : loadingLabel}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.root}
      >
        <BackArrow label={backLabel} onPress={onBack} />
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          {eyebrow ? <Text style={styles.brandBackdrop}>{eyebrow}</Text> : null}
          <View style={styles.heroTopRow}>
            {priceText ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{priceText}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>{year}</Text>
            </View>
          </View>

          <Animated.ScrollView
            ref={galleryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={slideWidth}
            snapToAlignment="start"
            decelerationRate={0.985}
            disableIntervalMomentum
            contentContainerStyle={styles.galleryContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: galleryScrollX } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleGalleryEnd}
          >
            {loopedGalleryImageUrls.map((imageUrl, index) => {
              const normalizedIndex =
                galleryImageUrls.length <= 1
                  ? index
                  : index === 0
                    ? galleryImageUrls.length - 1
                    : index === loopedGalleryImageUrls.length - 1
                      ? 0
                      : index - 1;
              return (
                <Pressable
                  key={`${title}-${imageUrl}-${index}`}
                  onPress={() => {
                    setActiveModalImageIndex(normalizedIndex);
                    setIsGalleryOpen(true);
                  }}
                  style={[styles.imageSlide, { width: slideWidth }]}
                >
                  <ResponsiveImage source={imageUrl} height={galleryHeight} priority="high" />
                </Pressable>
              );
            })}
          </Animated.ScrollView>

          <View style={styles.galleryDots}>
            {galleryImageUrls.length > 1 ? (
              <View
                style={[
                  styles.galleryDotsTrack,
                  {
                    width: galleryImageUrls.length * 22 + (galleryImageUrls.length - 1) * 8,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.galleryDotActive,
                    { transform: [{ translateX: paginationTranslateX }] },
                  ]}
                />
                {galleryImageUrls.map((_, index) => (
                  <View key={`${title}-dot-${index}`} style={styles.galleryDot} />
                ))}
              </View>
            ) : (
              <View style={styles.galleryDotSingle} />
            )}
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.modelLabel}>{title}</Text>
            {typeText ? <Text style={styles.typeValue}>{typeText}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        </View>

        <View style={styles.infoGrid}>
          {infoItems.map((item) => (
            <View
              key={`${item.label}-${item.value}`}
              style={[styles.infoCard, item.fullWidth ? styles.infoCardFullWidth : null]}
            >
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
          {actionButtons.length > 0 ? (
            <View style={styles.actionButtonsRow}>
              {actionButtons.map((button) => (
                <Pressable key={button.id} onPress={button.onPress} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{button.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={isGalleryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGalleryOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalClose} onPress={() => setIsGalleryOpen(false)}>
            <Text style={styles.modalCloseText}>{closeLabel}</Text>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToAlignment="center"
            contentOffset={{ x: activeModalImageIndex * width, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setActiveModalImageIndex(
                Math.max(0, Math.min(galleryImageUrls.length - 1, nextIndex)),
              );
            }}
          >
            {galleryImageUrls.map((imageUrl, index) => (
              <View key={`${title}-modal-${index}`} style={[styles.modalSlide, { width }]}>
                <ResponsiveImage
                  source={imageUrl}
                  height={modalImageHeight}
                  priority="high"
                  contentFit="contain"
                  containerStyle={styles.modalImage}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  root: {
    paddingBottom: 48,
    gap: 18,
  },
  stateRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 20,
  },
  header: {
    marginTop: 6,
  },
  headerCopy: {
    gap: 4,
  },
  eyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 42,
    lineHeight: 44,
    textTransform: "uppercase",
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  brandBackdrop: {
    position: "absolute",
    left: 18,
    top: 32,
    color: appColors.ink,
    opacity: 0.14,
    fontFamily: fontFamilies.displayBold,
    fontSize: 58,
    lineHeight: 58,
    textTransform: "uppercase",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceBadge: {
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  priceBadgeText: {
    color: appColors.background,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  yearBadge: {
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  yearBadgeText: {
    color: appColors.background,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  galleryContent: {
    alignItems: "center",
  },
  imageSlide: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  galleryDots: {
    marginTop: 10,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryDotsTrack: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  galleryDot: {
    width: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.inkSoft,
    opacity: 0.35,
  },
  galleryDotActive: {
    position: "absolute",
    left: 0,
    width: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.primary,
    opacity: 1,
  },
  galleryDotSingle: {
    width: 22,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.primary,
  },
  heroFooter: {
    gap: 6,
  },
  modelLabel: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    lineHeight: 26,
    textTransform: "uppercase",
  },
  typeValue: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  description: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionButtonsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  infoCard: {
    width: "47%",
    minHeight: 112,
    borderRadius: 22,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    justifyContent: "center",
  },
  infoCardFullWidth: {
    width: "100%",
    minHeight: 88,
  },
  infoLabel: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  infoValue: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 22,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(2, 4, 7, 0.96)",
    justifyContent: "center",
  },
  modalClose: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 2,
    borderRadius: 999,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  modalSlide: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    width: "100%",
  },
});
