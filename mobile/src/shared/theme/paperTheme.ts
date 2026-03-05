import { MD3LightTheme, type MD3Theme } from "react-native-paper";

import { appColors } from "./tokens";

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 24,
  colors: {
    ...MD3LightTheme.colors,
    primary: appColors.primary,
    onPrimary: appColors.primaryDeep,
    primaryContainer: "#3B3510",
    onPrimaryContainer: appColors.ink,
    secondary: appColors.ice,
    onSecondary: appColors.ink,
    secondaryContainer: "#1B1F25",
    onSecondaryContainer: appColors.ink,
    tertiary: appColors.primaryDeep,
    onTertiary: appColors.white,
    tertiaryContainer: "#191C22",
    onTertiaryContainer: appColors.ink,
    error: appColors.danger,
    background: appColors.background,
    onBackground: appColors.ink,
    surface: appColors.surface,
    onSurface: appColors.ink,
    surfaceVariant: appColors.surfaceAlt,
    onSurfaceVariant: appColors.inkSoft,
    outline: appColors.ice,
  },
};
export { appColors };
