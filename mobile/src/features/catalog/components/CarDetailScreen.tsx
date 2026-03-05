//car detail home screen the main style 
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { BackArrow } from "../../../shared/components/BackArrow";
import { ResponsiveImage } from "../../../shared/components/ResponsiveImage";
import { prefetchRemoteImages } from "../../../shared/lib/imagePipeline";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appShadows, appSpacing, withAlpha } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

const DOT_SIZE = 22;

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
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
  const activeImageIndexRef = useRef(0);

  const openGalleryAt = (index: number) => {
    setActiveModalImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  // ── The Master Scroll Value — Gemini's single-scrollview approach ─────────
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Layout constants ──────────────────────────────────────────────────────
  const HEADER_MAX = height * 0.62;
  const HEADER_MIN = height * 0.28;
  const SCROLL_DIST = HEADER_MAX - HEADER_MIN;

  // Header shrinks as you scroll up, stretches when pulling down
  const headerHeight = scrollY.interpolate({
    inputRange: [-100, 0, SCROLL_DIST],
    outputRange: [HEADER_MAX + 100, HEADER_MAX, HEADER_MIN],
    extrapolateLeft: "extend",
    extrapolateRight: "clamp",
  });

  // Subtle zoom on pull-down
  const imageScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.3, 1],
    extrapolate: "clamp",
  });

  // All overlay elements (meta, dots, swipe hint) fade as sheet rises
  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DIST * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // ── Looped infinite carousel ──────────────────────────────────────────────
  const slideWidth = width;
  const PAGINATION_STEP = 30;

  const loopedUrls = useMemo(
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
          inputRange: loopedUrls.map((_, i) => i * slideWidth),
          outputRange: loopedUrls.map(
            (_, i) =>
              (((i - 1) % galleryImageUrls.length) + galleryImageUrls.length) %
              galleryImageUrls.length * PAGINATION_STEP,
          ),
          extrapolate: "clamp",
        });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setActiveImageIndex(0);
    activeImageIndexRef.current = 0;
    setActiveModalImageIndex(0);
  }, [galleryImageUrls, activeImageIndexRef]);

  useEffect(() => {
    void prefetchRemoteImages(galleryImageUrls).catch(() => false);
  }, [galleryImageUrls]);

  useEffect(() => {
    if (galleryImageUrls.length <= 1) {
      galleryScrollX.setValue(0);
      setActiveImageIndex(0);
      activeImageIndexRef.current = 0;
      return;
    }
    requestAnimationFrame(() => {
      galleryScrollRef.current?.scrollTo({ x: slideWidth, animated: false });
      galleryScrollX.setValue(slideWidth);
      setActiveImageIndex(0);
      activeImageIndexRef.current = 0;
    });
  }, [galleryImageUrls.length, galleryScrollX, slideWidth, activeImageIndexRef]);

  const handleGalleryEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const raw = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (galleryImageUrls.length <= 1) {
      setActiveImageIndex(0);
      activeImageIndexRef.current = 0;
      return;
    }
    if (raw === 0) {
      const off = galleryImageUrls.length * slideWidth;
      requestAnimationFrame(() => {
        galleryScrollRef.current?.scrollTo({ x: off, animated: false });
        galleryScrollX.setValue(off);
      });
      setActiveImageIndex(galleryImageUrls.length - 1);
      activeImageIndexRef.current = galleryImageUrls.length - 1;
      return;
    }
    if (raw === loopedUrls.length - 1) {
      requestAnimationFrame(() => {
        galleryScrollRef.current?.scrollTo({ x: slideWidth, animated: false });
        galleryScrollX.setValue(slideWidth);
      });
      setActiveImageIndex(0);
      activeImageIndexRef.current = 0;
      return;
    }
    setActiveImageIndex(raw - 1);
    activeImageIndexRef.current = raw - 1;
  };

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading || !title) {
    return (
      <View style={styles.stateRoot}>
        <Text style={styles.stateText}>{hasError ? errorLabel : loadingLabel}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* ── FLOATING HEADER (photo) — Gemini's absolute approach ─── */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>

          {/* Looped carousel with scale on pull-down */}
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: imageScale }] }]}>
            <Animated.ScrollView
              ref={galleryScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideWidth}
              snapToAlignment="start"
              decelerationRate={0.985}
              disableIntervalMomentum
              style={{ flex: 1 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: galleryScrollX } } }],
                {
                  useNativeDriver: true,
                  listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                    if (galleryImageUrls.length === 0) {
                      activeImageIndexRef.current = 0;
                      return;
                    }
                    if (galleryImageUrls.length === 1) {
                      activeImageIndexRef.current = 0;
                      return;
                    }
                    const raw = Math.round(
                      event.nativeEvent.contentOffset.x / slideWidth,
                    );
                    if (raw <= 0) {
                      activeImageIndexRef.current = galleryImageUrls.length - 1;
                      return;
                    }
                    if (raw >= loopedUrls.length - 1) {
                      activeImageIndexRef.current = 0;
                      return;
                    }
                    activeImageIndexRef.current = raw - 1;
                  },
                },
              )}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleGalleryEnd}
            >
              {loopedUrls.map((url, index) => {
                const normIdx =
                  galleryImageUrls.length <= 1
                    ? index
                    : index === 0
                      ? galleryImageUrls.length - 1
                      : index === loopedUrls.length - 1
                        ? 0
                        : index - 1;
                return (
                  <Pressable
                    key={`img-${index}`}
                    style={{ width: slideWidth, flex: 1 }}
                    onPress={() => {
                      openGalleryAt(normIdx);
                    }}
                  >
                    <Animated.Image
                      source={{ uri: url }}
                      style={{ width: slideWidth, flex: 1, resizeMode: "cover" }}
                    />
                  </Pressable>
                );
              })}
            </Animated.ScrollView>
          </Animated.View>

          {/* All overlay UI fades as sheet scrolls up */}
          <Animated.View
            pointerEvents="none"
            style={[styles.overlayWrapper, { opacity: overlayOpacity }]}
          >

            {/* Year watermark */}
            <Text style={styles.watermark} numberOfLines={1}>{year}</Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
              {eyebrow ? (
                <View>
                  <Text style={styles.metaLabel}>Model code / number</Text>
                  <Text style={styles.metaValue}>{eyebrow}</Text>
                </View>
              ) : <View />}
              {typeText ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={styles.metaValue}>{typeText}</Text>
                </View>
              ) : <View />}
            </View>

            {/* Pagination dots */}
            {galleryImageUrls.length > 1 ? (
              <View style={styles.dotsRow}>
                <View
                  style={[
                    styles.dotsTrack,
                    { width: galleryImageUrls.length * 22 + (galleryImageUrls.length - 1) * 8 },
                  ]}
                >
                  <Animated.View
                    style={[styles.dotActive, { transform: [{ translateX: paginationTranslateX }] }]}
                  />
                  {galleryImageUrls.map((_, i) => (
                    <View key={`dot-${i}`} style={styles.dot} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.handleContainer}>
              <Text style={styles.swipeText}>SWIPE LEFT OR RIGHT</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* ── SCROLLABLE CONTENT — drives header collapse ───────────── */}
        <Animated.ScrollView
          contentContainerStyle={{ paddingTop: HEADER_MAX }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        >
          <View style={styles.detailsSheet}>
            <Text style={styles.sheetTitle}>Details</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {priceText ? (
                <View style={[styles.badge, { backgroundColor: appColors.primary }]}>
                  <Text style={[styles.badgeText, { color: appColors.inkDark }]}>{priceText}</Text>
                </View>
              ) : null}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{year}</Text>
              </View>
            </View>

            {/* Model name */}
            <View style={{ gap: 4, marginBottom: 12 }}>
              {eyebrow ? <Text style={styles.modelEyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.modelTitle}>{title}</Text>
            </View>

            {description ? <Text style={styles.description}>{description}</Text> : null}

            <View style={styles.divider} />

            {/* Info grid */}
            <View style={styles.grid}>
              {infoItems.map((item) => (
                <View
                  key={`${item.label}-${item.value}`}
                  style={[styles.gridItem, item.fullWidth ? styles.gridItemFull : null]}
                >
                  <Text style={styles.gridLabel}>{item.label}</Text>
                  <Text style={styles.gridValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            {actionButtons.map((btn) => (
              <Pressable key={btn.id} style={styles.mainBtn} onPress={btn.onPress}>
                <Text style={styles.btnText}>{btn.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.ScrollView>

        {/* ── NAV — always on top, z:100, never covered ─────────────── */}
        <View style={styles.topNav}>
          <BackArrow onPress={onBack} />
          <Pressable style={styles.roundBtn} hitSlop={12}>
            <Text style={styles.roundBtnText}>{"⊡"}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── FULLSCREEN GALLERY MODAL ──────────────────────────────────── */}
      <Modal
        visible={isGalleryOpen}
        transparent={false}
        animationType="none"
        onRequestClose={closeGallery}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalCloseBtn} onPress={closeGallery}>
            <Text style={styles.modalCloseTxt}>{closeLabel}</Text>
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: activeModalImageIndex * width, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveModalImageIndex(
                Math.max(0, Math.min(galleryImageUrls.length - 1, next)),
              );
            }}
          >
            {galleryImageUrls.map((url, i) => (
              <View key={`modal-${i}`} style={[styles.modalSlide, { width }]}>
                <ResponsiveImage
                  source={url}
                  height={height * 0.78}
                  priority="high"
                  contentFit="contain"
                  containerStyle={{ width: "100%" }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appColors.background },
  stateRoot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: appColors.sand },
  stateText: { color: appColors.inkDark, fontFamily: fontFamilies.displayBold, fontSize: 16 },

  // ── Header ─────────────────────────────────────────────────────────────
  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backgroundColor: appColors.sand,
    zIndex: 10,
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: appColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: appSpacing.xxl,
    paddingTop: 110,
  },
  watermark: {
    position: "absolute",
    top: 60,
    left: -8,
    right: -8,
    color: appColors.white,
    opacity: 0.07,
    fontFamily: fontFamilies.displayBold,
    fontSize: 130,
    lineHeight: 130,
    textTransform: "uppercase",
    letterSpacing: -5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  metaLabel: {
    fontSize: 10,
    color: appColors.inkDark,
    opacity: 0.5,
    fontFamily: fontFamilies.body,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 18,
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
  },

  // ── Pagination dots ────────────────────────────────────────────────────
  dotsRow: {
    position: "absolute",
    bottom: 38,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsTrack: { height: 18, flexDirection: "row", alignItems: "center", gap: appSpacing.md },
  dot: { width: DOT_SIZE, height: 6, borderRadius: appRadii.pill, backgroundColor: appColors.inkDark, opacity: 0.25 },
  dotActive: {
    position: "absolute", left: 0,
    width: DOT_SIZE, height: 6, borderRadius: appRadii.pill,
    backgroundColor: appColors.primary,
  },

  handleContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  swipeText: {
    fontSize: 9,
    fontFamily: fontFamilies.displayBold,
    letterSpacing: 1.5,
    color: appColors.inkDark,
    opacity: 0.35,
  },

  // ── Top nav (always visible) ───────────────────────────────────────────
  topNav: {
    position: "absolute",
    top: 50, left: appSpacing.xxl, right: appSpacing.xxl,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100,
  },
  roundBtn: {
    width: 45, height: 45, borderRadius: appRadii.xxl2,
    backgroundColor: appColors.surfaceBright,
    alignItems: "center", justifyContent: "center",
    ...appShadows.sm,
  },
  roundBtnText: {
    fontSize: 22,
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
  },

  // ── Details sheet ──────────────────────────────────────────────────────
  detailsSheet: {
    padding: appSpacing.xxxl,
    backgroundColor: appColors.background,
    minHeight: 700,
  },
  sheetTitle: {
    color: appColors.muted,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 13,
    fontFamily: fontFamilies.body,
    letterSpacing: 1,
    opacity: 0.6,
  },
  badgeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  badge: {
    paddingHorizontal: appSpacing.xl, paddingVertical: appSpacing.md,
    borderRadius: appRadii.pill,
    backgroundColor: withAlpha(appColors.white, 0.1),
  },
  badgeText: {
    color: appColors.white,
    fontSize: 13,
    fontFamily: fontFamilies.displayBold,
  },
  modelEyebrow: {
    color: appColors.primary,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  modelTitle: {
    color: appColors.white,
    fontSize: 30,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  description: {
    color: appColors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: withAlpha(appColors.white, 0.07),
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  gridItem: {
    width: "47%",
    backgroundColor: appColors.surfaceAlt,
    padding: appSpacing.xl,
    borderRadius: appRadii.xxl,
    borderWidth: 1,
    borderColor: withAlpha(appColors.white, 0.05),
    gap: appSpacing.xs,
  },
  gridItemFull: { width: "100%" },
  gridLabel: {
    color: appColors.muted,
    fontSize: 10,
    fontFamily: fontFamilies.displayBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  gridValue: {
    color: appColors.white,
    fontSize: 17,
    fontFamily: fontFamilies.displayBold,
    lineHeight: 21,
  },
  mainBtn: {
    backgroundColor: appColors.white,
    height: 56,
    borderRadius: appRadii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  btnText: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Modal ──────────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    backgroundColor: appColors.black,
    justifyContent: "center",
  },
  modalCloseBtn: {
    position: "absolute", top: 56, right: 24, zIndex: 3,
    borderRadius: appRadii.pill, backgroundColor: withAlpha(appColors.white, 0.1),
    paddingHorizontal: appSpacing.lg2, paddingVertical: appSpacing.md2,
  },
  modalCloseTxt: { color: appColors.white, fontFamily: fontFamilies.displayBold, fontSize: 14 },
  modalSlide: { height: "100%", alignItems: "center", justifyContent: "center" },
});
