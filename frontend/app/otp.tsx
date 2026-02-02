/**
 * OTP Verification Screen - FloodMap
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/shapes";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, resendVerification, pendingVerificationEmail } =
    useAuth();
  const { colors } = useTheme();

  const email = params.email || pendingVerificationEmail || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (value: string, index: number) => {
    // only allow digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // auto-submit when complete
    if (newOtp.every((d) => d) && newOtp.join("").length === OTP_LENGTH) {
      Keyboard.dismiss();
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== OTP_LENGTH) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await verifyEmail(email, otpCode);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        setError(res.message || "Invalid verification code");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Verification failed");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      const res = await resendVerification(email);
      if (res.success) {
        setCooldown(RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        setError(res.message || "Failed to resend code");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  // success view
  if (success) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View entering={FadeInUp.springify()} style={styles.centered}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: `${colors.success}15` },
            ]}
          >
            <MaterialSymbol
              name="check_circle"
              size={64}
              color={colors.success}
            />
          </View>
          <Text style={[styles.successTitle, { color: colors.onSurface }]}>
            Email Verified!
          </Text>
          <Text
            style={[styles.successSubtitle, { color: colors.onSurfaceVariant }]}
          >
            Redirecting to home...
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View entering={FadeInDown.springify()} style={styles.content}>
        {/* header icon */}
        <View style={styles.iconWrapper}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
              },
            ]}
          >
            <MaterialSymbol name="mail" size={48} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.onSurface }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          We sent a 6-digit code to
        </Text>
        <Text style={[styles.email, { color: colors.primary }]}>{email}</Text>

        {/* OTP input boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: digit
                    ? colors.primary
                    : error
                      ? colors.error
                      : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* error */}
        {error ? (
          <Animated.View entering={FadeInDown} style={styles.errorContainer}>
            <MaterialSymbol name="error" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        {/* verify button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleVerify()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <MaterialSymbol
                name="verified"
                size={20}
                color={colors.onPrimary}
              />
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                Verify Email
              </Text>
            </>
          )}
        </Pressable>

        {/* resend */}
        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { color: colors.onSurfaceVariant }]}>
            Didn't receive the code?{" "}
          </Text>
          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            <Text
              style={[
                styles.resendLink,
                {
                  color: cooldown > 0 ? colors.textMuted : colors.primary,
                },
              ]}
            >
              {isResending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend"}
            </Text>
          </Pressable>
        </View>

        {/* back button */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialSymbol
            name="arrow_back"
            size={20}
            color={colors.onSurfaceVariant}
          />
          <Text
            style={[styles.backButtonText, { color: colors.onSurfaceVariant }]}
          >
            Back to Sign Up
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    alignItems: "center",
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
  },
  email: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing["2xl"],
  },
  otpRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 13,
  },
  button: {
    flexDirection: "row",
    width: "100%",
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resendRow: {
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  successSubtitle: {
    fontSize: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
  },
});
