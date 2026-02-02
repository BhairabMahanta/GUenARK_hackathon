// app/(tabs)/index.tsx (COMPLETE - ALL ERRORS FIXED)
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { M3BottomSheet } from "@/components/M3BottomSheet";
import { LayerControlSheet } from "@/components/LayerControlSheet";
import { DrainDetailSheet } from "@/components/DrainDetailSheet";
import { FloodAlertsPanel } from "@/components/FloodZoneMarkers";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { GMapsCompass } from "@/components/GMapsCompass";
import { MapLayers } from "@/components/MapLayers";
import { DrainMarkers } from "@/components/DrainMarkers";
import { drainService, floodPredictionService } from "@/api";
import { Drain } from "@/types/drain.types";
import { EvacuationRoute } from "@/api/floodPrediction.service";
import { useTheme } from "@/theme/ThemeContext";
import { radii, spacing } from "@/theme/shapes";
import drainageBasinsGeoJSON from "@/data/guwahati_basin.json";
import {
  GUWAHATI_CENTER,
  MOCK_USER_LOCATION,
  floodZonesGeoJSON,
  landslideZonesGeoJSON,
  garbageHotspotsGeoJSON,
  evacuationRoutesGeoJSON,
  layerConfig,
  LAYER_COLORS,
  getDrainStatusColor,
} from "@/data/mockMapData";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN || "");

type LocationMode = "no_permission" | "panned" | "live_2d" | "live_3d";

export default function ExploreScreen() {
  const { colors } = useTheme();
  const cameraRef = useRef<Mapbox.Camera>(null!);
  const searchInputRef = useRef<TextInput>(null);
  const isSnappingToUser = useRef(false);

  // State
  const [apiDrains, setApiDrains] = useState<Drain[]>([]);
  const [filteredDrains, setFilteredDrains] = useState<Drain[]>([]);
  const [isLoadingDrains, setIsLoadingDrains] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrain, setSelectedDrain] = useState<Drain | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationMode, setLocationMode] =
    useState<LocationMode>("no_permission");
  const [layers, setLayers] = useState(
    layerConfig.filter((l) => l.id !== "hospitals"),
  );
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapHeading, setMapHeading] = useState(0);
  const [compassVisible, setCompassVisible] = useState(false);
  const [mapPitch, setMapPitch] = useState(0);

  // NEW: Evacuation routes state
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRoute[]>(
    [],
  );
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Bottom sheets
  const [layersSheetVisible, setLayersSheetVisible] = useState(false);
  const [drainDetailVisible, setDrainDetailVisible] = useState(false);
  const [floodAlertsVisible, setFloodAlertsVisible] = useState(false);

  const LOCATION_STORAGE_KEY = "user_last_location";

  // FIX: Move helper functions BEFORE useEffect hooks
  const getLayerEnabled = useCallback(
    (layerId: string) => {
      return layers.find((l) => l.id === layerId)?.enabled ?? false;
    },
    [layers],
  );

  const getSubLayerStates = useCallback(
    (layerId: string): Record<string, boolean> => {
      const layer = layers.find((l) => l.id === layerId);
      return (
        layer?.subLayers?.reduce(
          (acc, sub) => ({ ...acc, [sub.id]: sub.enabled }),
          {} as Record<string, boolean>,
        ) ?? ({} as Record<string, boolean>)
      );
    },
    [layers],
  );

  const saveLocationToStorage = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      try {
        await AsyncStorage.setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify(coords),
        );
      } catch (e) {
        console.log("Failed to save location:", e);
      }
    },
    [],
  );

  // Load stored location
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored && !userLocation) setUserLocation(JSON.parse(stored));
      } catch (e) {
        console.log("Failed to load stored location:", e);
      }
    })();
  }, []);

  // Fetch drains
  useEffect(() => {
    (async () => {
      try {
        const drains = await drainService.getAllDrains();
        setApiDrains(Array.isArray(drains) ? drains : []);
        setFilteredDrains(Array.isArray(drains) ? drains : []);
      } catch (e) {
        console.error("Failed to fetch drains:", e);
      } finally {
        setIsLoadingDrains(false);
      }
    })();
  }, []);

  // NEW: Fetch evacuation routes when evacuation layer is enabled OR flood alerts panel opens
  useEffect(() => {
    const evacuationLayerEnabled = getLayerEnabled("evacuation-routes");

    if (evacuationLayerEnabled || floodAlertsVisible) {
      if (evacuationRoutes.length === 0 && !isLoadingRoutes) {
        console.log("📍 Fetching evacuation routes...");
        setIsLoadingRoutes(true);

        floodPredictionService
          .getEvacuationRoutes()
          .then((routes) => {
            console.log(
              `✅ Loaded ${routes.length} evacuation routes from API`,
            );
            setEvacuationRoutes(routes);
          })
          .catch((err) => {
            console.error("❌ Failed to fetch evacuation routes:", err);
          })
          .finally(() => {
            setIsLoadingRoutes(false);
          });
      }
    } else if (!evacuationLayerEnabled && !floodAlertsVisible) {
      // Clear routes when both layer and alerts are disabled
      if (evacuationRoutes.length > 0) {
        console.log("🗑️  Clearing evacuation routes");
        setEvacuationRoutes([]);
      }
    }
  }, [
    getLayerEnabled,
    floodAlertsVisible,
    evacuationRoutes.length,
    isLoadingRoutes,
  ]);

  // Auto-refresh evacuation routes every 2 minutes when visible
  useEffect(() => {
    const evacuationLayerEnabled = getLayerEnabled("evacuation-routes");

    if (!evacuationLayerEnabled && !floodAlertsVisible) return;

    const interval = setInterval(
      () => {
        console.log("🔄 Refreshing evacuation routes...");

        floodPredictionService
          .getEvacuationRoutes()
          .then((routes) => {
            console.log(`✅ Refreshed ${routes.length} evacuation routes`);
            setEvacuationRoutes(routes);
          })
          .catch((err) => {
            console.error("❌ Failed to refresh evacuation routes:", err);
          });
      },
      2 * 60 * 1000,
    ); // 2 minutes

    return () => clearInterval(interval);
  }, [getLayerEnabled, floodAlertsVisible]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrains(apiDrains);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = apiDrains.filter(
      (drain) =>
        drain.drainId.toString().includes(query) ||
        drain.name?.toLowerCase().includes(query) ||
        drain.basinId.toLowerCase().includes(query) ||
        drain.zoneId.toLowerCase().includes(query),
    );
    setFilteredDrains(filtered);
  }, [searchQuery, apiDrains]);

  // Location tracking
  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationMode("no_permission");
          if (!userLocation) setUserLocation(MOCK_USER_LOCATION);
          return;
        }

        setLocationPermission(true);
        setLocationMode("panned");

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          saveLocationToStorage(coords);
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
          (loc) => {
            if (isMounted) {
              const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };
              setUserLocation(coords);
              saveLocationToStorage(coords);
            }
          },
        );
      } catch (error) {
        setLocationMode("no_permission");
        if (!userLocation) setUserLocation(MOCK_USER_LOCATION);
      }
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [saveLocationToStorage]);

  const animateToRegion = (coords: { latitude: number; longitude: number }) => {
    cameraRef.current?.setCamera({
      centerCoordinate: [coords.longitude, coords.latitude],
      zoomLevel: 15,
      animationDuration: 800,
    });
  };

  // Compass visibility: show when rotated, hide 5s after north
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (mapHeading !== 0) {
      setCompassVisible(true);
      if (timeout) clearTimeout(timeout);
    } else {
      timeout = setTimeout(() => setCompassVisible(false), 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [mapHeading]);

  const handleLocationButtonPress = async () => {
    Keyboard.dismiss();
    switch (locationMode) {
      case "no_permission":
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationPermission(true);
          setLocationMode("panned");
        }
        break;
      case "panned":
        if (userLocation) {
          isSnappingToUser.current = true;
          animateToRegion(userLocation);
          setLocationMode("live_2d");
          // Disable auto-pan detection for 1s while animating
          setTimeout(() => {
            isSnappingToUser.current = false;
          }, 1000);
        }
        break;
      case "live_2d":
        cameraRef.current?.setCamera({ pitch: 45, animationDuration: 300 });
        setMapPitch(45);
        setLocationMode("live_3d");
        break;
      case "live_3d":
        cameraRef.current?.setCamera({ pitch: 0, animationDuration: 300 });
        setMapPitch(0);
        setLocationMode("live_2d");
        break;
    }
  };

  const resetHeading = () => {
    cameraRef.current?.setCamera({
      heading: 0,
      pitch: 0,
      animationDuration: 300,
    });
    setMapPitch(0);
    if (locationMode === "live_3d") setLocationMode("live_2d");
  };

  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l)),
    );
  };

  const handleToggleSubLayer = (layerId: string, subLayerId: string) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId && layer.subLayers) {
          return {
            ...layer,
            subLayers: layer.subLayers.map((sub) =>
              sub.id === subLayerId ? { ...sub, enabled: !sub.enabled } : sub,
            ),
          };
        }
        return layer;
      }),
    );
  };

  const handleDrainPress = (drain: Drain) => {
    setSelectedDrain(drain);
    setDrainDetailVisible(true);
    animateToRegion({
      latitude: drain.location.coordinates[1],
      longitude: drain.location.coordinates[0],
    });
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL="mapbox://styles/mankho-pitika/cml2lfkev008e01r4e2zv48dc"
        onCameraChanged={(state) => {
          if (state.properties.zoom) setZoomLevel(state.properties.zoom);
          const heading = state.properties.heading ?? 0;
          setMapHeading(heading);

          // detect panning away from user location
          if (
            !isSnappingToUser.current &&
            userLocation &&
            (locationMode === "live_2d" || locationMode === "live_3d")
          ) {
            const center = state.properties.center;
            const dx = center[0] - userLocation.longitude;
            const dy = center[1] - userLocation.latitude;
            const distance = Math.sqrt(dx * dx + dy * dy) * 111000;
            if (distance > 100) {
              setLocationMode("panned");
              if (locationMode === "live_3d") setMapPitch(0);
            }
          }
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[
            GUWAHATI_CENTER.longitude,
            GUWAHATI_CENTER.latitude,
          ]}
          pitch={0}
        />

        <Mapbox.RasterDemSource
          id="mapbox-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxZoomLevel={14}
        >
          <Mapbox.Terrain exaggeration={2.5} />
        </Mapbox.RasterDemSource>

        {locationPermission && (
          <Mapbox.LocationPuck
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: "#4FC3F7", radius: 50 }}
          />
        )}

        <MapLayers
          drainageBasinsEnabled={getLayerEnabled("drainage-basins")}
          drainageBasinsSubLayers={getSubLayerStates("drainage-basins")}
          floodZonesEnabled={getLayerEnabled("flood-zones")}
          floodZonesSubLayers={getSubLayerStates("flood-zones")}
          landslideZonesEnabled={getLayerEnabled("landslide-zones")}
          landslideZonesSubLayers={getSubLayerStates("landslide-zones")}
          evacuationRoutesEnabled={getLayerEnabled("evacuation-routes")}
          evacuationRoutesSubLayers={getSubLayerStates("evacuation-routes")}
          garbageHotspotsEnabled={getLayerEnabled("garbage-hotspots")}
          drainStatusEnabled={getLayerEnabled("drain-status")}
          drainStatusSubLayers={getSubLayerStates("drain-status")}
          drainageBasinsGeoJSON={drainageBasinsGeoJSON}
          floodZonesGeoJSON={floodZonesGeoJSON}
          landslideZonesGeoJSON={landslideZonesGeoJSON}
          evacuationRoutesGeoJSON={evacuationRoutesGeoJSON}
          garbageHotspotsGeoJSON={garbageHotspotsGeoJSON}
          layerColors={LAYER_COLORS}
          apiEvacuationRoutes={evacuationRoutes}
        />

        {getLayerEnabled("drain-status") && (
          <DrainMarkers
            drains={filteredDrains.filter((drain) => {
              const subLayers = getSubLayerStates("drain-status");
              if (Object.keys(subLayers).length === 0) return true;
              if (!Object.values(subLayers).some((e) => !e)) return true;
              const statusMap: Record<string, string> = {
                critical: "drain-critical",
                warning: "drain-warning",
                watch: "drain-watch",
                safe: "drain-safe",
                offline: "drain-offline",
              };
              return subLayers[statusMap[drain.status]] === true;
            })}
            selectedDrainId={selectedDrain?.drainId}
            onDrainPress={handleDrainPress}
            getDrainStatusColor={getDrainStatusColor}
            zoomLevel={zoomLevel}
          />
        )}
      </Mapbox.MapView>

      {isLoadingDrains && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Loading drains...
          </Text>
        </View>
      )}

      {/* FIX: Use colors.primary instead of colors.tertiary */}
      {isLoadingRoutes && (
        <View style={[styles.loadingOverlay, { top: 80 }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.accent }]}>
            Loading routes...
          </Text>
        </View>
      )}

      <SafeAreaView
        style={styles.header}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          pointerEvents="auto"
        >
          <MaterialSymbol
            name="search"
            size={22}
            color={colors.onSurfaceVariant}
          />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search drains, basins..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialSymbol
                name="cancel"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* Map Controls - Top Right (Flood Alerts + Layers + Compass) */}
      <View style={styles.mapControlsTop} pointerEvents="box-none">
        {/* Flood Alerts Button */}
        <Pressable
          style={[
            styles.controlButton,
            {
              backgroundColor: floodAlertsVisible
                ? colors.error
                : colors.surface,
            },
          ]}
          onPress={() => setFloodAlertsVisible(true)}
        >
          <MaterialSymbol
            name="warning"
            size={22}
            color={floodAlertsVisible ? "#FFF" : colors.error}
          />
        </Pressable>

        {/* Layers Button */}
        <Pressable
          style={[
            styles.controlButton,
            {
              backgroundColor: layersSheetVisible
                ? colors.primary
                : colors.surface,
            },
          ]}
          onPress={() => setLayersSheetVisible(true)}
        >
          <MaterialSymbol
            name="layers"
            size={22}
            color={layersSheetVisible ? "#FFF" : colors.onSurface}
          />
        </Pressable>

        {/* Compass */}
        {compassVisible && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOut.duration(300)}
          >
            <Pressable
              style={[styles.controlButton, { backgroundColor: "transparent" }]}
              onPress={resetHeading}
            >
              <GMapsCompass heading={mapHeading} size={42} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* My Location Button - Bottom Right */}
      <View style={styles.myLocationContainer} pointerEvents="box-none">
        <Pressable
          style={[
            styles.controlButton,
            {
              backgroundColor:
                locationMode === "live_3d" ? colors.primary : colors.surface,
            },
          ]}
          onPress={handleLocationButtonPress}
        >
          {locationMode === "no_permission" && (
            <MaterialSymbol
              name="location_disabled"
              size={22}
              color={colors.onSurfaceVariant}
            />
          )}
          {locationMode === "panned" && (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  position: "absolute",
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  opacity: 0.25,
                }}
              />
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: "#FFF",
                }}
              />
            </View>
          )}
          {locationMode === "live_2d" && (
            <MaterialSymbol name="explore" size={22} color={colors.onSurface} />
          )}
          {locationMode === "live_3d" && (
            <MaterialSymbol name="explore" size={22} color="#FFF" />
          )}
        </Pressable>
      </View>

      {/* BOTTOM SHEETS */}
      <M3BottomSheet
        visible={floodAlertsVisible}
        onDismiss={() => setFloodAlertsVisible(false)}
        snapPoints={[70, 90]}
      >
        <FloodAlertsPanel onClose={() => setFloodAlertsVisible(false)} />
      </M3BottomSheet>

      <M3BottomSheet
        visible={layersSheetVisible}
        onDismiss={() => setLayersSheetVisible(false)}
        snapPoints={[60, 85]}
      >
        <LayerControlSheet
          layers={layers}
          onToggleLayer={handleToggleLayer}
          onToggleSubLayer={handleToggleSubLayer}
          onClose={() => setLayersSheetVisible(false)}
        />
      </M3BottomSheet>

      <M3BottomSheet
        visible={drainDetailVisible}
        onDismiss={() => {
          setDrainDetailVisible(false);
          setSelectedDrain(null);
        }}
        snapPoints={[70, 95]}
      >
        {selectedDrain && (
          <DrainDetailSheet
            drain={selectedDrain}
            onClose={() => {
              setDrainDetailVisible(false);
              setSelectedDrain(null);
            }}
            onViewFullDetails={() => {}}
          />
        )}
      </M3BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "#FFFC",
    padding: 12,
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    elevation: 6,
  },
  loadingText: { fontSize: 13, fontWeight: "600" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radii.xl,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  mapControlsTop: {
    position: "absolute",
    right: spacing.lg,
    top: 120,
    gap: spacing.md,
  },
  myLocationContainer: {
    position: "absolute",
    right: spacing.lg,
    bottom: 120,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
});
