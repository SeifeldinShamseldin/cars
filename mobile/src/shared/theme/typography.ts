import { Platform } from "react-native";

export const fontFamilies = {
  display: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "sans-serif-medium",
    default: "System",
  }),
  displayBold: Platform.select({
    ios: "AvenirNext-Heavy",
    android: "sans-serif-black",
    default: "System",
  }),
  body: Platform.select({
    ios: "AvenirNext-Regular",
    android: "sans-serif",
    default: "System",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;
