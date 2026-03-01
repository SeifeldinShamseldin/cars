import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";

type UseLoopingCarouselParams<T> = {
  items: T[];
  slideStep: number;
  paginationStep: number;
};

export const useLoopingCarousel = <T>({
  items,
  slideStep,
  paginationStep,
}: UseLoopingCarouselParams<T>) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselItems = useMemo(() => {
    if (items.length <= 1) {
      return items;
    }

    return [...items, ...items, ...items];
  }, [items]);

  const paginationTranslateX =
    items.length <= 1
      ? 0
      : scrollX.interpolate({
          inputRange: carouselItems.map((_, index) => index * slideStep),
          outputRange: carouselItems.map(
            (_, index) =>
              (((index % items.length) + items.length) % items.length) * paginationStep,
          ),
          extrapolate: "clamp",
        });

  useEffect(() => {
    if (items.length <= 1) {
      scrollX.setValue(0);
      setActiveIndex(0);
      return;
    }

    const targetOffset = slideStep * items.length;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: targetOffset, animated: false });
      scrollX.setValue(targetOffset);
      setActiveIndex(0);
    });
  }, [items.length, scrollX, slideStep]);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / slideStep);

    if (items.length <= 1) {
      setActiveIndex(0);
      return;
    }

    const normalizedIndex = ((rawIndex % items.length) + items.length) % items.length;
    const loopBaseIndex = items.length + normalizedIndex;
    const loopOffset = loopBaseIndex * slideStep;

    if (rawIndex !== loopBaseIndex) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: loopOffset, animated: false });
        scrollX.setValue(loopOffset);
      });
    }

    setActiveIndex(normalizedIndex);
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true },
  );

  return {
    scrollRef,
    scrollX,
    activeIndex,
    carouselItems,
    paginationTranslateX,
    onScroll,
    handleMomentumScrollEnd,
  };
};
