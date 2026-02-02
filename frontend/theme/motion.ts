/**
 * M3 Motion System with Spring Configurations
 */

import {
  Easing,
  WithSpringConfig,
  WithTimingConfig,
} from "react-native-reanimated";

// Duration tokens (ms)
export const durations = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
} as const;
  
// Easing curves
export const easings = {
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  linear: Easing.linear,
} as const;

// Spring configurations for M3 Expressive bounce
export const springs = {
  /** M3 Expressive signature bounce - tab indicators, FAB */
  expressive: {
    damping: 12,
    stiffness: 180,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Extra playful for celebrations */
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Subtle bounce for state changes */
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Quick response with minimal bounce - button presses */
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Smooth settle - page transitions */
  smooth: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  } satisfies WithSpringConfig,
} as const;

// Timing presets
export const timings = {
  fadeQuick: {
    duration: durations.short3,
    easing: easings.linear,
  } satisfies WithTimingConfig,

  transition: {
    duration: durations.medium1,
    easing: easings.standard,
  } satisfies WithTimingConfig,

  enter: {
    duration: durations.medium2,
    easing: easings.emphasizedDecelerate,
  } satisfies WithTimingConfig,

  exit: {
    duration: durations.short4,
    easing: easings.emphasizedAccelerate,
  } satisfies WithTimingConfig,
} as const;

export const stagger = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;
