// hooks/useLocationTracking.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_USER_LOCATION } from '@/data/mockMapData';

type LocationMode = "no_permission" | "panned" | "live_2d" | "live_3d";

const LOCATION_STORAGE_KEY = "user_last_location";

export const useLocationTracking = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>("no_permission");

  const saveLocationToStorage = useCallback(async (coords: { latitude: number; longitude: number }) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(coords));
    } catch (e) {
      console.log("Failed to save location:", e);
    }
  }, []);

  // Load stored location on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored && !userLocation) {
          setUserLocation(JSON.parse(stored));
        }
      } catch (e) {
        console.log("Failed to load stored location:", e);
      }
    })();
  }, []);

  // Watch location
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
        console.log("Location error:", error);
        setLocationMode("no_permission");
        if (!userLocation) setUserLocation(MOCK_USER_LOCATION);
      }
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [saveLocationToStorage]);

  return {
    userLocation,
    locationPermission,
    locationMode,
    setLocationMode,
  };
};
