/**
 * Google Maps style compass with red/white pointer
 * Smooth rotation following map heading, shortest path to north on tap
 */
import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";

interface GMapsCompassProps {
  heading: number;
  size?: number;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// normalize to -180 to 180
function normalizeAngle(angle: number): number {
  "worklet";
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

export function GMapsCompass({ heading, size = 28 }: GMapsCompassProps) {
  // track rotation as shared value for smooth continuous animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    // calc shortest path delta
    const targetRotation = -heading;
    const currentRotation = rotation.value;

    // normalize difference to find shortest path
    let delta = normalizeAngle(targetRotation - currentRotation);

    // spring to new rotation via shortest path
    rotation.value = withSpring(currentRotation + delta, {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
    });
  }, [heading, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const center = size / 2;
  const pointerLength = size * 0.35;
  const pointerWidth = size * 0.22;

  return (
    <AnimatedSvg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={animatedStyle}
    >
      {/* dark background circle */}
      <Circle cx={center} cy={center} r={center - 1} fill="#3C4043" />

      {/* red north triangle */}
      <Path
        d={`M ${center} ${center - pointerLength} 
            L ${center + pointerWidth / 2} ${center} 
            L ${center - pointerWidth / 2} ${center} Z`}
        fill="#EA4335"
      />

      {/* white south triangle */}
      <Path
        d={`M ${center} ${center + pointerLength} 
            L ${center + pointerWidth / 2} ${center} 
            L ${center - pointerWidth / 2} ${center} Z`}
        fill="#DADCE0"
      />
    </AnimatedSvg>
  );
}
