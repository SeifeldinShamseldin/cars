import { useState } from "react";
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

import { useCarDetail } from "../hooks/useCarCatalog";
import { useLoopingCarousel } from "../hooks/useLoopingCarousel";
import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { BackArrow } from "./BackArrow";
import { ResponsiveImage } from "./ResponsiveImage";

type CarDetailScreenProps = {
  carId: string;
  backLabel: string;
  typeLabel: string;
  topSpeedLabel: string;
  torqueLabel: string;
  yearLabel: string;
  onBack: () => void;
};

export const CarDetailScreen = ({
  carId,
  backLabel,
  typeLabel,
  topSpeedLabel,
  torqueLabel,
  yearLabel,
  onBack,
}: CarDetailScreenProps) => {
  const { width, height } = useWindowDimensions();
  const { car, isLoading, hasError } = useCarDetail(carId);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const screenHorizontalPadding = 40;
  const heroCardHorizontalPadding = 36;
  const slideWidth = Math.max(
    width - screenHorizontalPadding - heroCardHorizontalPadding,
    240,
  );
  const galleryGap = 0;
  const galleryStep = slideWidth + galleryGap;
  const galleryHeight = Math.min(Math.max(width * 0.74, 280), height * 0.48);
  const modalImageHeight = height * 0.76;
  const {
    scrollRef,
    activeIndex,
    carouselItems,
    paginationTranslateX,
    onScroll,
    handleMomentumScrollEnd,
  } = useLoopingCarousel({
    items: car?.galleryImageUrls ?? [],
    slideStep: galleryStep,
    paginationStep: 30,
  });

  const handleModalGalleryEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!car) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveModalImageIndex(
      Math.max(0, Math.min(car.galleryImageUrls.length - 1, nextIndex)),
    );
  };

  if (isLoading || !car) {
    return (
      <View style={styles.stateRoot}>
        <Text style={styles.stateText}>
          {hasError ? "Failed to load car details." : "Loading car details..."}
        </Text>
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
            <Text style={styles.eyebrow}>{car.brand}</Text>
            <Text style={styles.title}>{car.model}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.brandBackdrop}>{car.brand}</Text>
          <View style={styles.heroTopRow}>
            {car.priceLabel ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{car.priceLabel}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>{car.year}</Text>
            </View>
          </View>

          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={galleryStep}
            snapToAlignment="start"
            decelerationRate={0.985}
            disableIntervalMomentum
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            contentContainerStyle={styles.galleryContent}
          >
            {carouselItems.map((imageUrl, index) => (
              <Pressable
                key={`${car.id}-${imageUrl}-${index}`}
                onPress={() => {
                  const normalizedIndex =
                    ((index % car.galleryImageUrls.length) + car.galleryImageUrls.length) %
                    car.galleryImageUrls.length;
                  setActiveModalImageIndex(normalizedIndex);
                  setIsGalleryOpen(true);
                }}
                style={[
                  styles.imageSlide,
                  {
                    width: slideWidth,
                    marginRight: 0,
                  },
                ]}
              >
                <ResponsiveImage
                  source={imageUrl}
                  height={galleryHeight}
                />
              </Pressable>
            ))}
          </Animated.ScrollView>

          <View style={styles.galleryDots}>
            {car.galleryImageUrls.length > 1 ? (
              <View
                style={[
                  styles.galleryDotsTrack,
                  {
                    width: car.galleryImageUrls.length * 22 + (car.galleryImageUrls.length - 1) * 8,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.galleryDotActive,
                    { transform: [{ translateX: paginationTranslateX }] },
                  ]}
                />
                {car.galleryImageUrls.map((_, index) => (
                  <View key={`${car.id}-dot-${index}`} style={styles.galleryDot} />
                ))}
              </View>
            ) : (
              <View style={styles.galleryDotSingle} />
            )}
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.modelLabel}>{car.model}</Text>
            <Text style={styles.typeValue}>{car.type}</Text>
            <Text style={styles.description}>{car.description}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{typeLabel}</Text>
            <Text style={styles.infoValue}>{car.type}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{topSpeedLabel}</Text>
            <Text style={styles.infoValue}>{car.topSpeedKmh} KM/H</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{torqueLabel}</Text>
            <Text style={styles.infoValue}>{car.torqueNm} NM</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{yearLabel}</Text>
            <Text style={styles.infoValue}>{car.year}</Text>
          </View>
          {car.hp ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>HP</Text>
              <Text style={styles.infoValue}>{car.hp}</Text>
            </View>
          ) : null}
          {car.engineLabel ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Engine</Text>
              <Text style={styles.infoValue}>{car.engineLabel}</Text>
            </View>
          ) : null}
          {car.transmission ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Transmission</Text>
              <Text style={styles.infoValue}>{car.transmission}</Text>
            </View>
          ) : null}
          {car.fuelType ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Fuel</Text>
              <Text style={styles.infoValue}>{car.fuelType}</Text>
            </View>
          ) : null}
          {car.condition ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Condition</Text>
              <Text style={styles.infoValue}>{car.condition}</Text>
            </View>
          ) : null}
          {car.trim ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Trim</Text>
              <Text style={styles.infoValue}>{car.trim}</Text>
            </View>
          ) : null}
          {car.color ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{car.color}</Text>
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
          <Pressable
            style={styles.modalClose}
            onPress={() => setIsGalleryOpen(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToAlignment="center"
            contentOffset={{ x: activeModalImageIndex * width, y: 0 }}
            onMomentumScrollEnd={handleModalGalleryEnd}
          >
            {car.galleryImageUrls.map((imageUrl, index) => (
              <View
                key={`${car.id}-modal-${index}`}
                style={[styles.modalSlide, { width }]}
              >
                <ResponsiveImage
                  source={imageUrl}
                  height={modalImageHeight}
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
    height: 8,
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
    fontSize: 18,
    lineHeight: 22,
  },
  description: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 23,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    width: "48%",
    borderRadius: 22,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
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
    fontSize: 26,
    lineHeight: 28,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(4, 7, 12, 0.96)",
    justifyContent: "center",
  },
  modalClose: {
    position: "absolute",
    top: 58,
    right: 22,
    zIndex: 10,
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
    alignItems: "center",
    justifyContent: "center",
  },
});
