/**
 * Dark Blue-Gray Theme Color System
 * Based on Material 3 Expressive specifications
 *
 * Color Palette:
 * #CCD0CF - Lightest (text, highlights)
 * #9BA8AB - Light gray-blue (secondary text)
 * #4A5C6A - Slate gray (muted elements)
 * #253745 - Dark slate (elevated surfaces)
 * #11212D - Very dark blue (surfaces)
 * #06141B - Darkest (background)
 */

// MAIN PALETTE - Dark Blue-Gray
export const mainPalette = {
  lightest: "#CCD0CF",
  light: "#9BA8AB",
  mid: "#4A5C6A",
  dark: "#253745",
  darker: "#11212D",
  darkest: "#06141B",
};

// PRIMARY PALETTE - Teal accent derived from the palette
export const primaryPalette = {
  0: "#000000",
  10: "#001F2B",
  20: "#003545",
  30: "#004D63",
  40: "#006783",
  50: "#0082A5",
  60: "#00A3CC",
  70: "#00B4D8", // Primary - Teal Blue (harmonized with palette)
  80: "#5DE3FF",
  90: "#B8F0FF",
  95: "#DDFAFF",
  99: "#F8FDFF",
  100: "#FFFFFF",
};

// ACCENT PALETTE - Cool blue accent
export const accentPalette = {
  0: "#000000",
  10: "#0D1F2D",
  20: "#1A3A4A",
  30: "#275567",
  40: "#3A7085",
  50: "#4E8BA3",
  60: "#64A6C1",
  70: "#7BC1DF", // Accent - Soft cyan
  80: "#9ED4EC",
  90: "#C4E8F7",
  95: "#E2F4FB",
  100: "#FFFFFF",
};

// NEUTRAL PALETTE (Dark surfaces from provided palette)
export const neutralPalette = {
  0: "#000000",
  4: mainPalette.darkest, // #06141B - Background
  6: "#091820",
  10: mainPalette.darker, // #11212D - Surface
  12: "#182736",
  17: mainPalette.dark, // #253745 - Surface Container
  20: "#2E424F",
  24: "#374D5B",
  30: mainPalette.mid, // #4A5C6A - Mid-tone
  40: "#5E6F7C",
  50: "#74838E",
  60: mainPalette.light, // #9BA8AB - Secondary text
  70: "#A9B4B7",
  80: mainPalette.lightest, // #CCD0CF - Primary text
  90: "#E0E3E2",
  100: "#FFFFFF",
};

// ERROR/WARNING/SUCCESS PALETTE
export const errorPalette = {
  40: "#FF6B6B",
  80: "#FFB4AB",
};

export const warningPalette = {
  40: "#FFA726",
  80: "#FFD54F",
};

export const successPalette = {
  40: "#4CAF50",
  80: "#81C784",
};

// DARK THEME COLOR SCHEME
export const colors = {
  // Primary Teal Blue
  primary: primaryPalette[70], // #00B4D8
  onPrimary: mainPalette.darkest,
  primaryContainer: primaryPalette[30],
  onPrimaryContainer: primaryPalette[90],
  primaryDim: primaryPalette[60],

  // Accent
  accent: accentPalette[70], // #7BC1DF
  accentContainer: accentPalette[30],

  // Surfaces (using the provided palette)
  background: mainPalette.darkest, // #06141B
  surface: mainPalette.darker, // #11212D
  surfaceElevated: mainPalette.dark, // #253745
  surfaceContainer: mainPalette.dark, // #253745
  surfaceContainerLow: mainPalette.darker, // #11212D

  // Text (using the provided palette)
  onSurface: mainPalette.lightest, // #CCD0CF
  onSurfaceVariant: mainPalette.light, // #9BA8AB
  textMuted: mainPalette.mid, // #4A5C6A

  // Status colors
  error: errorPalette[40],
  onError: "#FFFFFF",
  warning: warningPalette[40],
  success: successPalette[40],
  info: primaryPalette[70],

  // Outline
  outline: mainPalette.mid, // #4A5C6A
  outlineVariant: mainPalette.dark, // #253745
};

export type Colors = typeof colors;
