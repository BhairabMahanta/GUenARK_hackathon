/** Search Screen - FloodMap */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  MaterialSymbol,
  MaterialSymbolName,
} from "@/components/MaterialSymbol";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/shapes";

interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: "zone" | "shelter" | "hospital";
  distance: string;
  coords?: { latitude: number; longitude: number };
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    name: "Kolkata Flood Zone A",
    address: "Near Howrah Bridge",
    type: "zone",
    distance: "2.3 km",
    coords: { latitude: 22.5958, longitude: 88.2636 },
  },
  {
    id: "2",
    name: "Emergency Shelter #12",
    address: "Salt Lake, Sector V",
    type: "shelter",
    distance: "4.1 km",
    coords: { latitude: 22.578, longitude: 88.4359 },
  },
  {
    id: "3",
    name: "City Hospital",
    address: "Park Street",
    type: "hospital",
    distance: "1.8 km",
    coords: { latitude: 22.5485, longitude: 88.3548 },
  },
];

const recentSearches = [
  "Flood alerts near me",
  "Emergency shelters",
  "Safe evacuation routes",
];

const getTypeIcon = (type: string): MaterialSymbolName => {
  switch (type) {
    case "zone":
      return "warning";
    case "shelter":
      return "home";
    case "hospital":
      return "local_hospital";
    default:
      return "location_on";
  }
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredResults =
    query.length > 0
      ? mockResults.filter((r) =>
          r.name.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Search</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Find flood zones, shelters & more
        </Text>
      </Animated.View>

      {/* Search Input */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : "transparent",
          },
        ]}
      >
        <MaterialSymbol
          name="search"
          size={22}
          color={focused ? colors.primary : colors.onSurfaceVariant}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search locations..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <MaterialSymbol
              name="cancel"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.quickActions}
      >
        {[
          {
            icon: "warning" as MaterialSymbolName,
            color: colors.error,
            label: "Alerts",
          },
          {
            icon: "shield" as MaterialSymbolName,
            color: colors.success,
            label: "Safe Zones",
          },
          {
            icon: "route" as MaterialSymbolName,
            color: colors.primary,
            label: "Routes",
          },
          {
            icon: "rainy" as MaterialSymbolName,
            color: colors.warning,
            label: "Weather",
          },
        ].map((item) => (
          <Pressable key={item.label} style={styles.quickAction}>
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <MaterialSymbol name={item.icon} size={20} color={item.color} />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      {/* Results or Recent */}
      {query.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
              <Pressable
                style={[styles.resultItem, { backgroundColor: colors.surface }]}
              >
                <View
                  style={[
                    styles.resultIcon,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <MaterialSymbol
                    name={getTypeIcon(item.type)}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.resultContent}>
                  <Text
                    style={[styles.resultName, { color: colors.onSurface }]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.resultAddress,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {item.address}
                  </Text>
                </View>
                <Text
                  style={[styles.resultDistance, { color: colors.primary }]}
                >
                  {item.distance}
                </Text>
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialSymbol
                name="search"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No results found
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.recentContainer}>
          <Text
            style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}
          >
            RECENT SEARCHES
          </Text>
          {recentSearches.map((search, index) => (
            <Animated.View
              key={search}
              entering={FadeInUp.delay(index * 50 + 300).springify()}
            >
              <Pressable
                style={[
                  styles.recentItem,
                  { borderBottomColor: colors.surfaceContainer },
                ]}
                onPress={() => setQuery(search)}
              >
                <MaterialSymbol
                  name="history"
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={[styles.recentText, { color: colors.onSurface }]}>
                  {search}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing["2xl"],
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing["3xl"],
  },
  quickAction: {
    alignItems: "center",
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  resultsList: {
    paddingBottom: 100,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 13,
  },
  resultDistance: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  recentContainer: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.lg,
    letterSpacing: 1,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  recentText: {
    fontSize: 15,
  },
});
