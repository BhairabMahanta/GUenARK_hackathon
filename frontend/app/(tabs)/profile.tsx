/** Profile Screen - FloodMap */
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { M3Switch } from "@/components/M3Switch";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { useHaptics } from "@/context/HapticsContext";
import { radii, spacing } from "@/theme/shapes";
import { colors } from "@/theme/colors";

const settingsData = [
  {
    icon: "notifications" as MaterialSymbolName,
    label: "Push Notifications",
    subtitle: "Get real-time flood alerts",
    type: "toggle" as const,
  },
  {
    icon: "location_on" as MaterialSymbolName,
    label: "Location Services",
    subtitle: "Required for accurate alerts",
    type: "toggle" as const,
  },
  {
    icon: "thunderstorm" as MaterialSymbolName,
    label: "Severe Weather Alerts",
    type: "toggle" as const,
  },
  {
    icon: "shield" as MaterialSymbolName,
    label: "Privacy Settings",
    type: "link" as const,
  },
  {
    icon: "help" as MaterialSymbolName,
    label: "Help & Support",
    type: "link" as const,
  },
  {
    icon: "info" as MaterialSymbolName,
    label: "About",
    type: "link" as const,
  },
];

// Login/Register form with M3 styling
function AuthForm() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();
  const { colors } = useTheme();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const res = await login({ email, password });
        if (!res.success) setError(res.message || "Login failed");
      } else {
        const res = await register({ name, email, password });
        if (res.success) {
          // navigate to OTP screen
          router.push({ pathname: "/otp", params: { email } });
        } else {
          setError(res.message || "Registration failed");
        }
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[
        styles.authCard,
        { backgroundColor: colors.surface, borderColor: `${colors.primary}10` },
      ]}
    >
      {/* Header Icon */}
      <View style={styles.authIconWrapper}>
        <View
          style={[
            styles.authIconCircle,
            {
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}30`,
            },
          ]}
        >
          <MaterialSymbol
            name={mode === "login" ? "account_circle" : "person_add"}
            size={48}
            color={colors.primary}
          />
        </View>
      </View>

      <Text style={[styles.authTitle, { color: colors.onSurface }]}>
        {mode === "login" ? "Welcome Back" : "Join FloodMap"}
      </Text>
      <Text style={[styles.authSubtitle, { color: colors.onSurfaceVariant }]}>
        {mode === "login"
          ? "Sign in to access your flood alerts"
          : "Create an account to get started"}
      </Text>

      {/* Name Input (Register only) */}
      {mode === "register" && (
        <Animated.View
          entering={FadeInDown.delay(50)}
          style={styles.inputWrapper}
        >
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <MaterialSymbol
              name="person"
              size={20}
              color={colors.onSurfaceVariant}
            />
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Full Name"
              placeholderTextColor={colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </Animated.View>
      )}

      {/* Email Input */}
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MaterialSymbol
            name="mail"
            size={20}
            color={colors.onSurfaceVariant}
          />
          <TextInput
            style={[styles.input, { color: colors.onSurface }]}
            placeholder="Email Address"
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MaterialSymbol
            name="lock"
            size={20}
            color={colors.onSurfaceVariant}
          />
          <TextInput
            style={[styles.input, { color: colors.onSurface }]}
            placeholder="Password"
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <MaterialSymbol
              name={showPassword ? "visibility_off" : "visibility"}
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <Animated.View entering={FadeInDown} style={styles.errorContainer}>
          <MaterialSymbol name="error" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Submit Button */}
      <Pressable
        style={({ pressed }) => [
          styles.authButton,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.9 },
        ]}
        onPress={handleSubmit}
        disabled={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <MaterialSymbol
              name={mode === "login" ? "login" : "person_add"}
              size={20}
              color={colors.onPrimary}
            />
            <Text style={[styles.authButtonText, { color: colors.onPrimary }]}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          </>
        )}
      </Pressable>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
        <Text style={[styles.dividerText, { color: colors.textMuted }]}>
          or
        </Text>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
      </View>

      {/* Mode Switch */}
      <Pressable style={styles.switchButton} onPress={toggleMode}>
        <Text style={[styles.switchText, { color: colors.onSurfaceVariant }]}>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Text style={[styles.switchTextBold, { color: colors.primary }]}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </Text>
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Authenticated profile view
function ProfileView() {
  const { user, logout, isLoading, profileImage, setProfileImage } = useAuth();
  const { colors, isDark, setTheme } = useTheme();
  const { hapticsEnabled, setHapticsEnabled, selection } = useHaptics();
  const [settings, setSettings] = useState<{ [key: string]: boolean }>({
    "Push Notifications": true,
    "Location Services": true,
    "Severe Weather Alerts": true,
  });

  const toggleSetting = (label: string) => {
    selection();
    setSettings((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleDarkMode = () => {
    selection();
    setTheme(isDark ? "light" : "dark");
  };

  const toggleHaptics = () => {
    // trigger haptic before disabling
    if (!hapticsEnabled) selection();
    setHapticsEnabled(!hapticsEnabled);
  };

  const handleLogout = async () => {
    selection();
    await logout();
  };

  // image picker handlers
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await setProfileImage(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Photo library access is needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await setProfileImage(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    selection();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromCamera();
          if (buttonIndex === 2) pickFromLibrary();
        },
      );
    } else {
      // Android fallback using Alert
      Alert.alert("Change Profile Photo", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: pickFromCamera },
        { text: "Choose from Library", onPress: pickFromLibrary },
      ]);
    }
  };

  return (
    <>
      {/* Profile Card */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surface,
            borderColor: `${colors.primary}10`,
          },
        ]}
      >
        {/* Avatar with edit overlay */}
        <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
          <View
            style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <MaterialSymbol name="person" size={40} color={colors.primary} />
            )}
          </View>
          {/* edit badge */}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <MaterialSymbol name="edit" size={12} color="#FFFFFF" />
          </View>
        </Pressable>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.onSurface }]}>
            {user?.name || "User"}
          </Text>
          <Text
            style={[styles.profileEmail, { color: colors.onSurfaceVariant }]}
          >
            {user?.email || ""}
          </Text>
        </View>
        <Pressable style={styles.editButton}>
          <MaterialSymbol name="edit" size={18} color={colors.primary} />
        </Pressable>
      </Animated.View>

      {/* Stats Row */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={[
          styles.statsRow,
          {
            backgroundColor: colors.surface,
            borderColor: `${colors.primary}10`,
          },
        ]}
      >
        {[
          { value: "3", label: "Saved\nPlaces" },
          { value: "12", label: "Alerts\nReceived" },
          { value: "5", label: "Days\nActive" },
        ].map((stat, index) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
              >
                {stat.label}
              </Text>
            </View>
            {index < 2 && (
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </Animated.View>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        SETTINGS
      </Text>
      {settingsData.map((item, index) => (
        <Animated.View
          key={item.label}
          entering={FadeInRight.delay(index * 50 + 300).springify()}
        >
          <Pressable
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => item.type === "toggle" && toggleSetting(item.label)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <MaterialSymbol
                name={item.icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.onSurface }]}>
                {item.label}
              </Text>
              {item.subtitle && (
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.type === "toggle" && (
              <M3Switch
                value={settings[item.label]}
                onValueChange={() => toggleSetting(item.label)}
                showIcons
                accessibilityLabel={item.label}
              />
            )}
            {item.type === "link" && (
              <MaterialSymbol
                name="chevron_right"
                size={22}
                color={colors.textMuted}
              />
            )}
          </Pressable>
        </Animated.View>
      ))}

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        APPEARANCE
      </Text>

      {/* Dark Mode Toggle */}
      <Animated.View entering={FadeInRight.delay(400).springify()}>
        <Pressable
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={toggleDarkMode}
        >
          <View
            style={[
              styles.settingIcon,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <MaterialSymbol
              name={isDark ? "dark_mode" : "light_mode"}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.onSurface }]}>
              Dark Mode
            </Text>
            <Text
              style={[
                styles.settingSubtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {isDark ? "On" : "Off"}
            </Text>
          </View>
          <M3Switch
            value={isDark}
            onValueChange={toggleDarkMode}
            showIcons
            accessibilityLabel="Dark Mode"
          />
        </Pressable>
      </Animated.View>

      {/* Haptic Feedback Toggle - using settings icon as fallback */}
      <Animated.View entering={FadeInRight.delay(450).springify()}>
        <Pressable
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={toggleHaptics}
        >
          <View
            style={[
              styles.settingIcon,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <MaterialSymbol name="settings" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.onSurface }]}>
              Haptic Feedback
            </Text>
            <Text
              style={[
                styles.settingSubtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Vibration on interactions
            </Text>
          </View>
          <M3Switch
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
            showIcons
            accessibilityLabel="Haptic Feedback"
          />
        </Pressable>
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInRight.delay(500).springify()}>
        <Pressable
          style={[styles.settingItem, styles.settingItemDanger]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <View style={[styles.settingIcon, styles.settingIconDanger]}>
            <MaterialSymbol name="logout" size={20} color={colors.error} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, styles.settingLabelDanger]}>
              Sign Out
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Versioning */}
      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={styles.version}
      >
        <Text style={styles.versionText}>FloodMap v1.0.0</Text>
      </Animated.View>
    </>
  );
}

export default function ProfileScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Profile
          </Text>
          <Pressable style={styles.settingsButton}>
            <MaterialSymbol
              name="settings"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>

        {isAuthenticated ? <ProfileView /> : <AuthForm />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing["2xl"],
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.onSurface,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  // Auth form
  authCard: {
    backgroundColor: colors.surface,
    padding: spacing["2xl"],
    borderRadius: radii["2xl"],
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}10`,
  },
  authIconWrapper: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  authIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
  },
  authSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  inputWrapper: {
    gap: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.onSurfaceVariant}20`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: spacing.xs,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: `${colors.error}15`,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  authButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  authButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  authButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors.onSurfaceVariant}20`,
  },
  dividerText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  switchButton: {
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    fontSize: 14,
  },
  switchTextBold: {
    color: colors.primary,
    fontWeight: "600",
  },
  // Profile
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}10`,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.onSurface,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  editButton: {
    padding: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderRadius: radii.md,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: `${colors.onSurfaceVariant}20`,
  },
  // Settings
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurface,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  settingItemDanger: {
    backgroundColor: `${colors.error}08`,
  },
  settingIconDanger: {
    backgroundColor: `${colors.error}15`,
  },
  settingLabelDanger: {
    color: colors.error,
  },
  // Versioning
  version: {
    alignItems: "center",
    marginTop: spacing["2xl"],
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    opacity: 0.5,
  },
});
