/**
 * Tabs Layout - M3 Expressive Design with Theme Support
 */

import { Tabs } from "expo-router";
import React from "react";
import { View, StatusBar, StyleSheet } from "react-native";
import { enableScreens, enableFreeze } from "react-native-screens";
import { M3NavigationBar } from "@/components/M3NavigationBar";
import { useTheme } from "@/theme/ThemeContext";

// Enable native screen optimization
enableScreens(true);
enableFreeze(true);

// Navigation items configuration
const NAV_ITEMS = [
  {
    key: "index",
    label: "Explore",
    icon: "near_me" as const,
    activeIcon: "near_me" as const,
  },
  {
    key: "search",
    label: "Search",
    icon: "search" as const,
    activeIcon: "search" as const,
  },
  {
    key: "saved",
    label: "Saved",
    icon: "bookmark" as const,
    activeIcon: "bookmark" as const,
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person" as const,
    activeIcon: "person" as const,
  },
];

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",
          lazy: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
        tabBar={(props) => {
          const { state, navigation } = props;
          return (
            <M3NavigationBar
              items={NAV_ITEMS}
              activeIndex={state.index}
              onItemPress={(index) => {
                const route = state.routes[index];
                navigation.navigate(route.name);
              }}
            />
          );
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Explore" }} />
        <Tabs.Screen name="search" options={{ title: "Search" }} />
        <Tabs.Screen name="saved" options={{ title: "Saved" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
