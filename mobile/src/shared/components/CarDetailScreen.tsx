import { useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";

import { useCarDetail } from "../hooks/useCarCatalog";
import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { BackArrow } from "./BackArrow";

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
  const { width } = useWindowDimensions();
  const { car, isLoading, hasError } = useCarDetail(carId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const slideWidth = Math.max(width - 40, 280);

  const handleGalleryEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!car) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveImageIndex(
      Math.max(0, Math.min(car.galleryImageUrls.length - 1, nextIndex)),
    );
  };

  const handleModalGalleryEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!car) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={slideWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            disableIntervalMomentum
            onMomentumScrollEnd={handleGalleryEnd}
            contentContainerStyle={styles.galleryContent}
          >
            {car.galleryImageUrls.map((imageUrl, index) => (
              <Pressable
                key={`${car.id}-${index}`}
                onPress={() => {
                  setActiveImageIndex(index);
                  setIsGalleryOpen(true);
                }}
                style={[
                  styles.imageSlide,
                  {
                    width: slideWidth,
                    marginRight:
                      index === car.galleryImageUrls.length - 1 ? 0 : 16,
                  },
                ]}
              >
                <Image
                  source={imageUrl}
                  style={styles.image}
                  contentFit="contain"
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.galleryDots}>
            {car.galleryImageUrls.map((_, index) => (
              <View
                key={`${car.id}-dot-${index}`}
                style={[
                  styles.galleryDot,
                  index === activeImageIndex && styles.galleryDotActive,
                ]}
              />
            ))}
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
            contentOffset={{ x: activeImageIndex * width, y: 0 }}
            onMomentumScrollEnd={handleModalGalleryEnd}
          >
            {car.galleryImageUrls.map((imageUrl, index) => (
              <View
                key={`${car.id}-modal-${index}`}
                style={[styles.modalSlide, { width }]}
              >
                <Image source={imageUrl} style={styles.modalImage} contentFit="contain" />
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
  },
  image: {
    width: "100%",
    height: 260,
  },
  galleryDots: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: appColors.inkSoft,
    opacity: 0.35,
  },
  galleryDotActive: {
    width: 22,
    backgroundColor: appColors.primary,
    opacity: 1,
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
  modalImage: {
    width: "100%",
    height: "70%",
  },
});
