import React, { useEffect } from "react";
import { View, Pressable, StyleSheet, AccessibilityInfo } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useTheme } from "@/theme/ThemeContext";

interface M3SwitchProps {
  /** Current value of the switch */
  value: boolean;
  /** Callback when value changes */
  onValueChange: (value: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Show check/close icons inside handle */
  showIcons?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Custom track colors */
  trackColor?: {
    false: string;
    true: string;
  };
  /** Custom thumb/handle colors */
  thumbColor?: {
    false: string;
    true: string;
  };
}

/**
 * Material 3 Switch Component
 *
 * A fully-featured M3 switch with:
 * - Animated handle translation and scaling
 * - Optional check/close icons
 * - Proper touch targets (48dp)
 * - Full accessibility support
 * - Dark/Light theme support
 *
 * @example
 * <M3Switch
 *   value={isEnabled}
 *   onValueChange={setIsEnabled}
 *   showIcons
 *   accessibilityLabel="Enable notifications"
 * />
 */
export const M3Switch: React.FC<M3SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  showIcons = false,
  accessibilityLabel,
  trackColor,
  thumbColor,
}) => {
  const { colors } = useTheme();

  // Animation values
  const progress = useSharedValue(value ? 1 : 0);
  const pressScale = useSharedValue(1);

  // M3 Switch dimensions
  const TRACK_WIDTH = 52;
  const TRACK_HEIGHT = 32;
  const HANDLE_SIZE_OFF = 16;
  const HANDLE_SIZE_ON = 24;
  const HANDLE_SIZE_PRESSED = 28;
  const TRACK_PADDING = 4;

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.05, 0.7, 0.1, 1), // Emphasized decelerate
    });
  }, [value, progress]);

  const handlePress = () => {
    if (disabled) return;

    const newValue = !value;
    onValueChange(newValue);

    // Announce state change for accessibility
    AccessibilityInfo.announceForAccessibility(newValue ? "On" : "Off");
  };

  const handlePressIn = () => {
    if (disabled) return;
    pressScale.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(0, { duration: 100 });
  };

  // Track animated styles
  const trackAnimatedStyle = useAnimatedStyle(() => {
    const trackColorFalse = trackColor?.false ?? colors.surfaceContainer;
    const trackColorTrue = trackColor?.true ?? colors.primary;

    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [trackColorFalse, trackColorTrue],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.outline, "transparent"],
      ),
      borderWidth: interpolate(progress.value, [0, 1], [2, 0]),
    };
  });

  // Handle animated styles
  const handleAnimatedStyle = useAnimatedStyle(() => {
    // Calculate handle size based on state
    const baseSize = interpolate(
      progress.value,
      [0, 1],
      [showIcons ? HANDLE_SIZE_ON : HANDLE_SIZE_OFF, HANDLE_SIZE_ON],
    );
    const currentSize = interpolate(
      pressScale.value,
      [0, 1],
      [baseSize, HANDLE_SIZE_PRESSED],
    );

    // Calculate handle position
    const startX = TRACK_PADDING + (showIcons ? 0 : 4);
    const endX = TRACK_WIDTH - TRACK_PADDING - currentSize;

    const thumbColorFalse = thumbColor?.false ?? colors.outline;
    const thumbColorTrue = thumbColor?.true ?? colors.onPrimary;

    return {
      width: currentSize,
      height: currentSize,
      borderRadius: currentSize / 2,
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [startX, endX]),
        },
      ],
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [thumbColorFalse, thumbColorTrue],
      ),
    };
  });

  // Icon animated styles
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: showIcons ? 1 : 0,
    };
  });

  const disabledOpacity = disabled ? 0.38 : 1;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to toggle"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.touchTarget}
    >
      <Animated.View
        style={[styles.track, trackAnimatedStyle, { opacity: disabledOpacity }]}
      >
        <Animated.View style={[styles.handle, handleAnimatedStyle]}>
          {showIcons && (
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              <MaterialSymbol
                name={value ? "check" : "close"}
                size={16}
                color={value ? colors.primary : colors.onSurfaceVariant}
              />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    width: 52,
    height: 48,
    justifyContent: "center",
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
  },
  handle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default M3Switch;
