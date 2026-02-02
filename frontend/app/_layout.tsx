/**
 * Root Layout - FloodMap App
 */
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { HapticsProvider } from "@/context/HapticsContext";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

// inner component that uses theme
function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="otp" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <HapticsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </HapticsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
