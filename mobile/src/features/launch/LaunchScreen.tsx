import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { appColors } from "../../shared/theme/paperTheme";
import { fontFamilies } from "../../shared/theme/typography";

const keyImage = require("../../../assets/images/porsche-992-key.png");
const topCarImage = require("../../../assets/images/porsche-911-top.png");
const launchLogo = require("../../../assets/images/launch-logo.png");

type LaunchScreenProps = {
  headline: string;
  shadow: string;
  metaLabel: string;
  metaValue: string;
  continueLabel: string;
  onContinue: () => void;
};

export const LaunchScreen = ({
  headline,
  shadow,
  metaLabel,
  metaValue,
  continueLabel,
  onContinue,
}: LaunchScreenProps) => {
  void headline;
  void shadow;
  void metaLabel;
  void metaValue;
  void continueLabel;

  const [isAnimating, setIsAnimating] = useState(false);
  const keyOpacity = useRef(new Animated.Value(1)).current;
  const keyScale = useRef(new Animated.Value(1)).current;
  const keyTranslateY = useRef(new Animated.Value(0)).current;
  const topCarOpacity = useRef(new Animated.Value(0)).current;
  const topCarScale = useRef(new Animated.Value(0.86)).current;
  const topCarTranslateY = useRef(new Animated.Value(0)).current;
  const promptOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(1)).current;
  const brandHighlightOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(keyOpacity, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(keyScale, {
            toValue: 0.92,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(keyTranslateY, {
            toValue: 28,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(promptOpacity, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(topCarOpacity, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(topCarScale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandOpacity, {
            toValue: 0.58,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(topCarTranslateY, {
            toValue: -238,
            duration: 3000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(topCarScale, {
            toValue: 0.8,
            duration: 3000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandOpacity, {
            toValue: 0.24,
            duration: 2600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandHighlightOpacity, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onContinue();
    });
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.hero}>
        <Animated.Text
          style={[
            styles.backdropBrand,
            {
              opacity: brandOpacity,
            },
          ]}
        >
          PORSCHE
        </Animated.Text>
        <Animated.Text
          style={[
            styles.backdropBrand,
            styles.backdropBrandHighlight,
            {
              opacity: brandHighlightOpacity,
              transform: [
                {
                  translateY: topCarTranslateY.interpolate({
                    inputRange: [-238, 0],
                    outputRange: [72, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          PORSCHE
        </Animated.Text>

        <Animated.View
          style={[
            styles.keyFrame,
            {
              opacity: keyOpacity,
              transform: [{ translateY: keyTranslateY }, { scale: keyScale }],
            },
          ]}
        >
          <Image source={keyImage} style={styles.keyImage} resizeMode="contain" />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.topCarFrame,
            {
              opacity: topCarOpacity,
              transform: [{ translateY: topCarTranslateY }, { scale: topCarScale }],
            },
          ]}
        >
          <Image source={topCarImage} style={styles.topCarImage} resizeMode="contain" />
        </Animated.View>
      </View>

      <View style={styles.bottomStack}>
        <Animated.View style={[styles.bottomInfo, { opacity: promptOpacity }]}>
          <View style={styles.logoWrap}>
            <Image source={launchLogo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.prompt}>Tap the key to unlock the ride.</Text>
        </Animated.View>
      </View>

      <View style={styles.progressRail}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  hero: {
    flex: 1,
    minHeight: 640,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backdropBrand: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -30,
    color: "rgba(255,255,255,0.14)",
    fontFamily: fontFamilies.displayBold,
    fontSize: 60,
    lineHeight: 60,
    textAlign: "center",
    letterSpacing: 1,
  },
  backdropBrandHighlight: {
    color: "rgba(255,255,255,0.58)",
  },
  keyFrame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  keyImage: {
    width: 460,
    height: 900,
  },
  topCarFrame: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  topCarImage: {
    width: 350,
    height: 700,
  },
  bottomStack: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 36,
  },
  bottomInfo: {
    marginBottom: 28,
  },
  prompt: {
    alignSelf: "flex-start",
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 28,
    lineHeight: 30,
    textAlign: "left",
    textTransform: "uppercase",
    maxWidth: 280,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: 148,
    height: 148,
  },
  progressRail: {
    height: 6,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: appColors.primary,
  },
});
