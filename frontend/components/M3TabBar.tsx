import React from "react";
import { View, Pressable, Text, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";

interface TabConfig {
  name: string;
  icon: MaterialSymbolName;
  iconFilled: MaterialSymbolName;
  label: string;
}

const TABS: TabConfig[] = [
  {
    name: "index",
    icon: "explore",
    iconFilled: "explore",
    label: "Explore",
  },
  { name: "search", icon: "search", iconFilled: "search", label: "Search" },
  {
    name: "saved",
    icon: "bookmark",
    iconFilled: "bookmark",
    label: "Saved",
  },
  {
    name: "profile",
    icon: "person",
    iconFilled: "person",
    label: "Profile",
  },
];

export function M3TabBar({ state, navigation }: BottomTabBarProps) {
  const containerWidth = useSharedValue(0);
  const activeIndex = useSharedValue(state.index);

  React.useEffect(() => {
    activeIndex.value = state.index;
  }, [state.index, activeIndex]);

  const tabWidth = useDerivedValue(() => {
    if (containerWidth.value === 0) return 0;
    return containerWidth.value / state.routes.length;
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const width = tabWidth.value;
    if (width === 0) return { opacity: 0 };

    return {
      opacity: 1,
      width: width - 24,
      transform: [
        {
          translateX: withSpring(width * activeIndex.value + 12, {
            damping: 18,
            stiffness: 180,
            mass: 0.8,
          }),
        },
      ],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 pb-6 px-4">
      <View
        className="flex-row bg-[#0D1321] rounded-3xl py-3 border border-primary/15"
        style={{
          shadowColor: "#00D4FF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
        onLayout={onLayout}
      >
        {/* Animated Pill Indicator */}
        <Animated.View
          className="absolute top-2 bottom-2 bg-primary/15 rounded-[20px] overflow-hidden"
          style={indicatorStyle}
        >
          <View className="absolute top-0 left-1/2 w-10 h-0.5 bg-primary rounded-sm -translate-x-5" />
        </Animated.View>

        {/* Tab Buttons */}
        {state.routes.map((route, index) => {
          const tabConfig = TABS.find((t) => t.name === route.name) || TABS[0];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              config={tabConfig}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabButtonProps {
  config: TabConfig;
  isFocused: boolean;
  onPress: () => void;
}

function TabButton({ config, isFocused, onPress }: TabButtonProps) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isFocused ? 1.1 : 1, {
            damping: 12,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <Pressable
      className="flex-1 items-center justify-center gap-1"
      onPress={onPress}
    >
      <Animated.View style={animatedIconStyle}>
        <MaterialSymbol
          name={isFocused ? config.iconFilled : config.icon}
          size={24}
          color={isFocused ? "#00D4FF" : "#6B7280"}
        />
      </Animated.View>
      <Text
        className={`text-[11px] font-semibold tracking-wide ${
          isFocused ? "text-primary opacity-100" : "text-text-muted opacity-60"
        }`}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}
