import { MD3LightTheme, type MD3Theme } from "react-native-paper";

const palette = {
  primary: "#E7D31A",
  primaryDeep: "#090A0D",
  primarySoft: "#8F8417",
  ice: "#2B2F36",
  background: "#050608",
  surface: "#0C0F13",
  surfaceAlt: "#14181D",
  ink: "#F4F4EF",
  inkSoft: "#979DA7",
  white: "#FFFFFF",
  success: "#59B07B",
  danger: "#D96652",
  accent: "#1D2128",
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 24,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: palette.primaryDeep,
    primaryContainer: "#3B3510",
    onPrimaryContainer: palette.ink,
    secondary: palette.ice,
    onSecondary: palette.ink,
    secondaryContainer: "#1B1F25",
    onSecondaryContainer: palette.ink,
    tertiary: palette.primaryDeep,
    onTertiary: palette.white,
    tertiaryContainer: "#191C22",
    onTertiaryContainer: palette.ink,
    error: palette.danger,
    background: palette.background,
    onBackground: palette.ink,
    surface: palette.surface,
    onSurface: palette.ink,
    surfaceVariant: palette.surfaceAlt,
    onSurfaceVariant: palette.inkSoft,
    outline: palette.ice,
  },
};

export const appColors = palette;
