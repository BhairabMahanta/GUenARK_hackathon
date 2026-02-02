/**
 * Light Theme Color System
 */
import {
  primaryPalette,
  accentPalette,
  errorPalette,
  warningPalette,
  successPalette,
} from "./colors";

// LIGHT THEME COLOR SCHEME - Softer tones
export const lightColors = {
  primary: primaryPalette[50],
  onPrimary: "#FFFFFF",
  primaryContainer: primaryPalette[95],
  onPrimaryContainer: primaryPalette[20],
  primaryDim: primaryPalette[60],

  // Accent
  accent: accentPalette[50],
  accentContainer: accentPalette[95],

  // Surfaces - softer grays with slight blue tint
  background: "#F2F4F5",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFBFC",
  surfaceContainer: "#E8EBEC",
  surfaceContainerLow: "#EEF1F2",

  // Text - good contrast
  onSurface: "#1A1C1E",
  onSurfaceVariant: "#42474E",
  textMuted: "#6B7280",

  // Status
  error: "#DC2626",
  onError: "#FFFFFF",
  warning: "#F59E0B",
  success: "#10B981",
  info: primaryPalette[50],

  // Outline
  outline: "#6B7280",
  outlineVariant: "#D1D5DB",
};

export type LightColors = typeof lightColors;
