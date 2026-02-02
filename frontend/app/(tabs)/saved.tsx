/** Saved Places Screen - FloodMap */
import React from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing, elevation } from "@/theme/shapes";

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  type: "home" | "work" | "custom";
  riskLevel: "low" | "medium" | "high";
  lastUpdated: string;
}

const savedPlaces: SavedPlace[] = [
  {
    id: "1",
    name: "Home",
    address: "Salt Lake, Sector II",
    type: "home",
    riskLevel: "low",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Work",
    address: "Park Street",
    type: "work",
    riskLevel: "medium",
    lastUpdated: "30 min ago",
  },
  {
    id: "3",
    name: "Parents House",
    address: "Howrah",
    type: "custom",
    riskLevel: "high",
    lastUpdated: "1 hour ago",
  },
];

const getTypeIcon = (type: string): MaterialSymbolName => {
  switch (type) {
    case "home":
      return "home";
    case "work":
      return "work";
    default:
      return "star";
  }
};

export default function SavedScreen() {
  const { colors } = useTheme();

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const renderHeader = () => (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={[
        styles.alertBanner,
        {
          backgroundColor: `${colors.warning}15`,
          borderColor: `${colors.warning}30`,
        },
      ]}
    >
      <View
        style={[styles.alertIcon, { backgroundColor: `${colors.warning}20` }]}
      >
        <MaterialSymbol name="notifications" size={20} color={colors.warning} />
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: colors.warning }]}>
          Active Alert
        </Text>
        <Text
          style={[styles.alertSubtitle, { color: colors.onSurfaceVariant }]}
        >
          1 saved location has elevated flood risk
        </Text>
      </View>
      <MaterialSymbol
        name="chevron_right"
        size={24}
        color={colors.onSurfaceVariant}
      />
    </Animated.View>
  );

  const renderFooter = () => (
    <Animated.View
      entering={FadeInDown.delay(500).springify()}
      style={[
        styles.quickAdd,
        {
          backgroundColor: colors.surface,
          borderColor: `${colors.primary}10`,
        },
      ]}
    >
      <Text style={[styles.quickAddTitle, { color: colors.onSurfaceVariant }]}>
        QUICK ADD
      </Text>
      <View style={styles.quickAddButtons}>
        {[
          { icon: "home" as MaterialSymbolName, label: "Home" },
          { icon: "work" as MaterialSymbolName, label: "Work" },
          { icon: "add_location" as MaterialSymbolName, label: "Custom" },
        ].map((item) => (
          <Pressable key={item.label} style={styles.quickAddButton}>
            <MaterialSymbol name={item.icon} size={24} color={colors.primary} />
            <Text
              style={[styles.quickAddLabel, { color: colors.onSurfaceVariant }]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Saved Places
        </Text>
        <Pressable
          style={[
            styles.addButton,
            {
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}30`,
            },
          ]}
        >
          <MaterialSymbol name="add" size={24} color={colors.primary} />
        </Pressable>
      </Animated.View>

      {/* Places List */}
      <FlatList
        data={savedPlaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInRight.delay(index * 100 + 200).springify()}
          >
            <Pressable
              style={[
                styles.placeCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}08`,
                },
              ]}
            >
              <View style={styles.placeHeader}>
                <View
                  style={[
                    styles.placeIcon,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <MaterialSymbol
                    name={getTypeIcon(item.type)}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, { color: colors.onSurface }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.placeAddress,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {item.address}
                  </Text>
                </View>
                <Pressable style={styles.moreButton}>
                  <MaterialSymbol
                    name="more_vert"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              />
              <View style={styles.placeFooter}>
                <View style={styles.riskIndicator}>
                  <View
                    style={[
                      styles.riskDot,
                      { backgroundColor: getRiskColor(item.riskLevel) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.riskLabel,
                      { color: getRiskColor(item.riskLevel) },
                    ]}
                  >
                    {item.riskLevel.charAt(0).toUpperCase() +
                      item.riskLevel.slice(1)}{" "}
                    Risk
                  </Text>
                </View>
                <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                  Updated {item.lastUpdated}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 120,
  },
  placeCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...elevation.level2,
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
  },
  moreButton: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  placeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  lastUpdated: {
    fontSize: 12,
  },
  quickAdd: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    ...elevation.level3,
  },
  quickAddTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  quickAddButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickAddButton: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  quickAddLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});
