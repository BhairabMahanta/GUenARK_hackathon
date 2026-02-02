/**
 * M3NavigationBar - Material 3 Navigation Bar with Theme Support
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";
import { useTheme } from "@/theme/ThemeContext";
import { springs, timings } from "@/theme/motion";
import { spacing, radii } from "@/theme/shapes";

export interface NavigationBarItem {
  key: string;
  label: string;
  icon: MaterialSymbolName;
  activeIcon: MaterialSymbolName;
}

export interface M3NavigationBarProps {
  items: NavigationBarItem[];
  activeIndex: number;
  onItemPress: (index: number) => void;
}

interface NavItemProps {
  item: NavigationBarItem;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NavItem({ item, isActive, onPress, colors }: NavItemProps) {
  const scale = useSharedValue(1);
  const indicatorScale = useSharedValue(isActive ? 1 : 0);
  const iconScale = useSharedValue(isActive ? 1 : 0.9);
  const activeOpacity = useSharedValue(isActive ? 1 : 0);
  const inactiveOpacity = useSharedValue(isActive ? 0 : 1);

  React.useEffect(() => {
    indicatorScale.value = withSpring(isActive ? 1 : 0, springs.expressive);
    iconScale.value = withSpring(isActive ? 1.05 : 0.9, springs.expressive);
    activeOpacity.value = withTiming(isActive ? 1 : 0, timings.transition);
    inactiveOpacity.value = withTiming(isActive ? 0 : 1, timings.transition);

    if (isActive) {
      iconScale.value = withSpring(1, springs.gentle);
    }
  }, [indicatorScale, iconScale, activeOpacity, inactiveOpacity, isActive]);

  const handlePressIn = useCallback(() => {
    "worklet";
    scale.value = withSpring(0.92, springs.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    "worklet";
    scale.value = withSpring(1, springs.expressive);
  }, [scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: indicatorScale.value }],
    opacity: indicatorScale.value,
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: activeOpacity.value,
    transform: [{ scale: iconScale.value }],
    position: "absolute" as const,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: inactiveOpacity.value,
  }));

  return (
    <AnimatedPressable
      style={[styles.navItem, containerStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: `${colors.primary}25` },
            indicatorStyle,
          ]}
        />
        <View style={styles.iconContainer}>
          <Animated.View style={inactiveIconStyle}>
            <MaterialSymbol
              name={item.icon}
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Animated.View>
          <Animated.View style={activeIconStyle}>
            <MaterialSymbol
              name={item.activeIcon}
              size={24}
              color={colors.primary}
            />
          </Animated.View>
        </View>
      </View>

      <Text
        style={[
          styles.label,
          { color: isActive ? colors.primary : colors.onSurfaceVariant },
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </AnimatedPressable>
  );
}

export function M3NavigationBar({
  items,
  activeIndex,
  onItemPress,
}: M3NavigationBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainer,
          borderTopColor: colors.outlineVariant,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      {items.map((item, index) => (
        <NavItem
          key={item.key}
          item={item}
          isActive={index === activeIndex}
          onPress={() => onItemPress(index)}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
    minHeight: 56,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 32,
    marginBottom: spacing.xs,
  },
  indicator: {
    position: "absolute",
    width: 64,
    height: 32,
    borderRadius: radii.full,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  labelActive: {
    fontWeight: "700",
  },
});

export default M3NavigationBar;
