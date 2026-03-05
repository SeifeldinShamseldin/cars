export const appColors = {
  primary: "#E7D31A",
  primaryDeep: "#090A0D",
  primarySoft: "#8F8417",
  ice: "#2B2F36",
  background: "#181818",
  surface: "#212121",
  surfaceAlt: "#2e2e2e",
  ink: "#F4F4EF",
  inkSoft: "#979DA7",
  white: "#FFFFFF",
  black: "#000000",
  success: "#59B07B",
  danger: "#D96652",
  dangerBright: "#FF3B30",
  accent: "#1D2128",
  sand: "#EBE6DA",
  inkDark: "#1C1C1E",
  muted: "#888888",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  mutedCard: "#212121",
  surfaceGlass: "rgba(255,255,255,0.08)",
  surfaceBright: "rgba(255,255,255,0.92)",
  surfaceDeep: "#2e2e2e",
  surfaceMuted: "#2e2e2e",
  surfaceDarker: "#2e2e2e",
  scrimDark: "#101010",
  inputBg: "#2e2e2e",
  inputBorder: "rgba(255,255,255,0.05)",
} as const;

export const withAlpha = (hexColor: string, alpha: number) => {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) {
    return hexColor;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const appSpacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  md2: 10,
  lg: 12,
  lg2: 14,
  xl: 16,
  xl2: 18,
  xxl: 20,
  xxl2: 22,
  xxxl: 24,
  xxxl2: 28,
  huge: 32,
  giant: 36,
  massive: 40,
} as const;

export const appRadii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxl2: 22,
  xxxl: 24,
  mega: 28,
  pill: 999,
} as const;

export const appShadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
