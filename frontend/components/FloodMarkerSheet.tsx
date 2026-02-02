import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/shapes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PEEK_CARD_WIDTH = 140;

interface FloodMarker {
  id: string;
  title: string;
  description: string;
  risk: "high" | "medium" | "low";
  coords: { latitude: number; longitude: number };
}

interface FloodMarkerSheetProps {
  /** Currently selected marker for expanded view */
  marker: FloodMarker | null;
  /** All markers for peek view */
  markers?: FloodMarker[];
  /** Whether in peek mode (0) or expanded mode (1+) */
  snapIndex?: number;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Callback when a marker is selected from peek view */
  onMarkerSelect?: (marker: FloodMarker) => void;
  /** Callback for navigation button */
  onNavigate?: () => void;
  /** Callback for save button */
  onSave?: () => void;
}

const getRiskIcon = (risk: string): MaterialSymbolName => {
  switch (risk) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "check_circle";
    default:
      return "info";
  }
};

const getSafetyTips = (risk: string): string[] => {
  switch (risk) {
    case "high":
      return [
        "Avoid this area during heavy rainfall",
        "Keep emergency supplies ready if you live nearby",
        "Monitor local alerts and weather updates",
        "Have an evacuation plan prepared",
      ];
    case "medium":
      return [
        "Exercise caution during monsoon season",
        "Avoid parking vehicles in low-lying areas",
        "Keep drainage clear around your property",
      ];
    case "low":
      return [
        "Area has good drainage infrastructure",
        "Stay informed about weather conditions",
        "Report any drainage issues to authorities",
      ];
    default:
      return [];
  }
};

/**
 * Peek Card - shown in horizontal list when in peek mode
 */
const PeekCard: React.FC<{
  marker: FloodMarker;
  onPress: () => void;
  index: number;
  isSelected?: boolean;
}> = ({ marker, onPress, index, isSelected }) => {
  const { colors } = useTheme();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.info;
    }
  };

  const riskColor = getRiskColor(marker.risk);

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <Pressable
        style={[
          styles.peekCard,
          { backgroundColor: colors.surfaceContainer },
          isSelected && { borderWidth: 2, borderColor: colors.primary },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${marker.title}, ${marker.risk} risk`}
      >
        <View style={[styles.peekRiskDot, { backgroundColor: riskColor }]} />
        <Text
          style={[styles.peekCardTitle, { color: colors.onSurface }]}
          numberOfLines={2}
        >
          {marker.title}
        </Text>
        <Text style={[styles.peekRiskLabel, { color: riskColor }]}>
          {marker.risk.toUpperCase()}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Flood Marker Sheet Content
 *
 * Two modes:
 * 1. Peek mode (snapIndex=0): Shows horizontal list of all markers
 * 2. Expanded mode (snapIndex>0): Shows detailed info for selected marker
 */
export const FloodMarkerSheet: React.FC<FloodMarkerSheetProps> = ({
  marker,
  markers = [],
  snapIndex = 0,
  onClose,
  onMarkerSelect,
  onNavigate,
  onSave,
}) => {
  const { colors } = useTheme();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.info;
    }
  };

  // Show marker details if a marker is selected
  if (marker) {
    const riskColor = getRiskColor(marker.risk);
    const safetyTips = getSafetyTips(marker.risk);

    const handleNavigate = () => {
      const { latitude, longitude } = marker.coords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url);
      onNavigate?.();
    };

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with close button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {/* Risk Badge */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={[styles.riskBadge, { backgroundColor: `${riskColor}20` }]}
            >
              <MaterialSymbol
                name={getRiskIcon(marker.risk)}
                size={18}
                color={riskColor}
              />
              <Text style={[styles.riskText, { color: riskColor }]}>
                {marker.risk.toUpperCase()} RISK
              </Text>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              entering={FadeInDown.delay(150).springify()}
              style={[styles.title, { color: colors.onSurface }]}
            >
              {marker.title}
            </Animated.Text>
          </View>

          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: colors.surfaceContainer },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialSymbol
              name="close"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </View>

        {/* Description */}
        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={[styles.description, { color: colors.onSurfaceVariant }]}
        >
          {marker.description}
        </Animated.Text>

        {/* Coordinates */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={styles.coordsContainer}
        >
          <MaterialSymbol
            name="location_on"
            size={18}
            color={colors.onSurfaceVariant}
          />
          <Text style={[styles.coordsText, { color: colors.onSurfaceVariant }]}>
            {marker.coords.latitude.toFixed(4)}°N,{" "}
            {marker.coords.longitude.toFixed(4)}°E
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.actions}
        >
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleNavigate}
            accessibilityRole="button"
            accessibilityLabel="Navigate to location"
          >
            <MaterialSymbol
              name="navigation"
              size={20}
              color={colors.onPrimary}
            />
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              Navigate
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
                borderWidth: 1,
              },
            ]}
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save location"
          >
            <MaterialSymbol name="bookmark" size={20} color={colors.primary} />
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              Save
            </Text>
          </Pressable>
        </Animated.View>

        {/* Safety Tips */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          style={[
            styles.safetySection,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <Text style={[styles.safetyTitle, { color: colors.onSurface }]}>
            Safety Tips
          </Text>
          {safetyTips.map((tip, index) => (
            <View key={index} style={styles.safetyItem}>
              <MaterialSymbol name="shield" size={16} color={colors.primary} />
              <Text
                style={[styles.safetyText, { color: colors.onSurfaceVariant }]}
              >
                {tip}
              </Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    );
  }

  // No marker selected - show vertical list
  return (
    <View style={styles.container}>
      <View style={styles.expandedHeader}>
        <MaterialSymbol name="water_drop" size={24} color={colors.primary} />
        <Text style={[styles.expandedTitle, { color: colors.onSurface }]}>
          Select a Flood Zone
        </Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {markers.map((m) => (
          <Pressable
            key={m.id}
            style={[
              styles.expandedListItem,
              { backgroundColor: colors.surfaceContainer },
            ]}
            onPress={() => onMarkerSelect?.(m)}
          >
            <View
              style={[
                styles.riskDot,
                { backgroundColor: getRiskColor(m.risk) },
              ]}
            />
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: colors.onSurface }]}>
                {m.title}
              </Text>
              <Text
                style={[
                  styles.listItemRisk,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {m.risk.toUpperCase()} RISK
              </Text>
            </View>
            <MaterialSymbol
              name="chevron_right"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Peek mode styles
  peekContainer: {
    paddingVertical: spacing.sm,
  },
  peekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  peekTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  peekCount: {
    fontSize: 13,
  },
  peekScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  peekCard: {
    width: PEEK_CARD_WIDTH,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  peekRiskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  peekCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  peekRiskLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Expanded mode styles
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  riskText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  coordsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  coordsText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  safetySection: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Expanded list styles
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  expandedTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  expandedListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  listItemRisk: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default FloodMarkerSheet;
