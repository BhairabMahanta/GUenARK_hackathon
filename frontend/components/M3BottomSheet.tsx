// components/M3BottomSheet.tsx (FIX GESTURE BLOCKING SCROLL)
import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  BackHandler,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface M3BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
}

export const M3BottomSheet: React.FC<M3BottomSheetProps> = ({
  visible,
  onDismiss,
  children,
  snapPoints = [60, 90],
  initialSnapIndex = 0,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(initialSnapIndex);
  
  const snapPositions = snapPoints.map(
    (percent) => SCREEN_HEIGHT * (1 - percent / 100)
  );
  
  const minSnap = Math.min(...snapPositions);

  const close = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      onDismiss();
      setCurrentIndex(initialSnapIndex);
    }, 250);
  }, [onDismiss, initialSnapIndex, translateY, backdropOpacity]);

  const snapTo = useCallback((currentY: number, velocity: number) => {
    if (currentY > SCREEN_HEIGHT * 0.7 || velocity > 1500) {
      runOnJS(close)();
      return;
    }

    let nearest = snapPositions[0];
    let nearestIndex = 0;
    let minDist = Math.abs(currentY - snapPositions[0]);

    snapPositions.forEach((pos, idx) => {
      const dist = Math.abs(currentY - pos);
      if (dist < minDist) {
        minDist = dist;
        nearest = pos;
        nearestIndex = idx;
      }
    });

    // ✅ Better velocity handling
    if (Math.abs(velocity) > 300) {
      if (velocity < -300 && nearestIndex < snapPositions.length - 1) {
        nearestIndex++;
        nearest = snapPositions[nearestIndex];
      } else if (velocity > 300 && nearestIndex > 0) {
        nearestIndex--;
        nearest = snapPositions[nearestIndex];
      }
    }

    translateY.value = withSpring(nearest, {
      damping: 30,
      stiffness: 300,
      mass: 0.5,
    });
    runOnJS(setCurrentIndex)(nearestIndex);
  }, [snapPositions, close, translateY]);

  // ✅ HANDLE GESTURE - More sensitive
  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10]) // ✅ Activate faster
    .failOffsetX([-20, 20]) // ✅ Allow horizontal scroll
    .onUpdate((event) => {
      const newY = snapPositions[currentIndex] + event.translationY;
      translateY.value = Math.max(minSnap, Math.min(SCREEN_HEIGHT, newY));
    })
    .onEnd((event) => {
      runOnJS(snapTo)(translateY.value, event.velocityY);
    });

  useEffect(() => {
    if (visible) {
      const initialPos = snapPositions[initialSnapIndex];
      translateY.value = withSpring(initialPos, {
        damping: 30,
        stiffness: 300,
        mass: 0.5,
      });
      backdropOpacity.value = withTiming(0.4, { duration: 200 });
      setCurrentIndex(initialSnapIndex);
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialSnapIndex, snapPositions, translateY, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, close]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [snapPositions[snapPositions.length - 1], SCREEN_HEIGHT],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  if (!visible) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + 16,
          },
          sheetStyle,
        ]}
      >
        {/* ✅ LARGER DRAGGABLE HEADER - 80px */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.header}>
            <Animated.View style={handleOpacity}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: colors.onSurfaceVariant },
                ]}
              />
            </Animated.View>
            {/* ✅ Add text hint */}
            <Animated.Text 
              style={[
                styles.hint, 
                { color: colors.onSurfaceVariant },
                handleOpacity
              ]}
            >
              Drag to expand
            </Animated.Text>
          </View>
        </GestureDetector>

        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000000",
    zIndex: 999,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 1000,
  },
  header: {
    height: 80, // ✅ Taller header
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
});

export default M3BottomSheet;
