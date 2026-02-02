import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface HapticsContextType {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  // haptic triggers
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
  selection: () => void;
}

const HapticsContext = createContext<HapticsContextType | undefined>(undefined);

const HAPTICS_STORAGE_KEY = "app_haptics_enabled";

export const HapticsProvider = ({ children }: { children: ReactNode }) => {
  const [hapticsEnabled, setEnabledState] = useState(true);

  // load saved pref
  useEffect(() => {
    AsyncStorage.getItem(HAPTICS_STORAGE_KEY).then((saved) => {
      if (saved !== null) {
        setEnabledState(saved === "true");
      }
    });
  }, []);

  const setHapticsEnabled = (enabled: boolean) => {
    setEnabledState(enabled);
    AsyncStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
  };

  // haptic wrappers
  const light = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const medium = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const heavy = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };
  const success = () => {
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const warning = () => {
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };
  const error = () => {
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const selection = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  return (
    <HapticsContext.Provider
      value={{
        hapticsEnabled,
        setHapticsEnabled,
        light,
        medium,
        heavy,
        success,
        warning,
        error,
        selection,
      }}
    >
      {children}
    </HapticsContext.Provider>
  );
};

export const useHaptics = () => {
  const ctx = useContext(HapticsContext);
  if (!ctx) throw new Error("useHaptics must be used within HapticsProvider");
  return ctx;
};
