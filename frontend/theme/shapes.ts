/**
 * M3 Shape System - Corner radii and spacing
 */

import { Platform, ViewStyle } from "react-native";

// Corner radii tokens
export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  "3xl": 32,
  full: 9999,
} as const;

// Spacing scale
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

// Elevation/shadows
export const elevation = {
  level0: {} as ViewStyle,

  level1: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
      },
      android: {
        elevation: 2,
      },
    }),
  } as ViewStyle,

  level2: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.0,
      },
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,

  level3: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 5.0,
      },
      android: {
        elevation: 6,
      },
    }),
  } as ViewStyle,

  level4: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8.0,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
} as const;
