// components/MapLayers.tsx (COMPLETE - EVACUATION ROUTES RENDERING)
import React from "react";
import Mapbox from "@rnmapbox/maps";
import { View, StyleSheet } from "react-native";
import { MaterialSymbol } from "./MaterialSymbol";
import { EvacuationRoute } from "@/api/floodPrediction.service";

interface MapLayersProps {
  drainageBasinsEnabled: boolean;
  drainageBasinsSubLayers?: Record<string, boolean>;
  floodZonesEnabled: boolean;
  floodZonesSubLayers?: Record<string, boolean>;
  landslideZonesEnabled: boolean;
  landslideZonesSubLayers?: Record<string, boolean>;
  evacuationRoutesEnabled: boolean;
  evacuationRoutesSubLayers?: Record<string, boolean>;
  garbageHotspotsEnabled: boolean;
  drainStatusEnabled: boolean;
  drainStatusSubLayers?: Record<string, boolean>;
  drainageBasinsGeoJSON: any;
  floodZonesGeoJSON: any;
  landslideZonesGeoJSON: any;
  evacuationRoutesGeoJSON: any;
  garbageHotspotsGeoJSON: any;
  layerColors: any;
  apiEvacuationRoutes?: EvacuationRoute[];
}

export const MapLayers: React.FC<MapLayersProps> = ({
  drainageBasinsEnabled,
  drainageBasinsSubLayers = {},
  drainageBasinsGeoJSON,
  floodZonesEnabled,
  floodZonesSubLayers = {},
  floodZonesGeoJSON,
  landslideZonesEnabled,
  landslideZonesSubLayers = {},
  landslideZonesGeoJSON,
  evacuationRoutesEnabled,
  evacuationRoutesSubLayers = {},
  evacuationRoutesGeoJSON,
  garbageHotspotsEnabled,
  garbageHotspotsGeoJSON,
  apiEvacuationRoutes = [],
}) => {
  
  // Helper to filter GeoJSON by sub-layer
  const filterByBasin = (geoJSON: any, subLayers: Record<string, boolean>) => {
    if (Object.keys(subLayers).length === 0) return geoJSON;
    
    const enabledBasins = Object.entries(subLayers)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => {
        const basinMap: Record<string, string> = {
          "dipor-beel": "Dipor Beel Basin",
          "morabiharalu": "Morabiharalu Basin",
          "morabharalu": "Morabharalu Basin",
          "bahini": "Bahini Basin",
          "silsako": "Silsako Basin",
          "bharalu": "Bharalu Basin",
          "basistha": "Basistha Basin",
          "noonmati": "Noonmati Basin",
          "haimala": "Harimala Basin",
        };
        return basinMap[id];
      });
    
    if (enabledBasins.length === 0) return { ...geoJSON, features: [] };
    
    return {
      ...geoJSON,
      features: geoJSON.features.filter((f: any) => 
        enabledBasins.includes(f.properties?.name)
      )
    };
  };

  const filterByRiskLevel = (geoJSON: any, subLayers: Record<string, boolean>, riskProperty: string) => {
    if (Object.keys(subLayers).length === 0) return geoJSON;
    
    const enabledLevels = Object.entries(subLayers)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => {
        if (id.includes("high") || id.includes("severe")) return "high";
        if (id.includes("medium") || id.includes("moderate")) return "medium";
        if (id.includes("low")) return "low";
        return null;
      })
      .filter(Boolean);
    
    if (enabledLevels.length === 0) return { ...geoJSON, features: [] };
    
    return {
      ...geoJSON,
      features: geoJSON.features.filter((f: any) => 
        enabledLevels.includes(f.properties?.[riskProperty])
      )
    };
  };

  const filterByRouteType = (geoJSON: any, subLayers: Record<string, boolean>) => {
    if (Object.keys(subLayers).length === 0) return geoJSON;
    
    const enabledTypes = Object.entries(subLayers)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => {
        if (id.includes("primary")) return "primary";
        if (id.includes("secondary")) return "secondary";
        if (id.includes("emergency")) return "emergency";
        return null;
      })
      .filter(Boolean);
    
    if (enabledTypes.length === 0) return { ...geoJSON, features: [] };
    
    return {
      ...geoJSON,
      features: geoJSON.features.filter((f: any) => 
        enabledTypes.includes(f.properties?.type)
      )
    };
  };

  // Apply filters
  const filteredBasinsGeoJSON = filterByBasin(drainageBasinsGeoJSON, drainageBasinsSubLayers);
  const filteredFloodZonesGeoJSON = filterByRiskLevel(floodZonesGeoJSON, floodZonesSubLayers, "risk");
  const filteredLandslideZonesGeoJSON = filterByRiskLevel(landslideZonesGeoJSON, landslideZonesSubLayers, "severity");
  const filteredEvacRoutesGeoJSON = filterByRouteType(evacuationRoutesGeoJSON, evacuationRoutesSubLayers);

  // Convert API evacuation routes to GeoJSON
  const getRouteColor = (status: EvacuationRoute['status']) => {
    switch (status) {
      case 'clear': return '#10B981';
      case 'congested': return '#F59E0B';
      case 'blocked': return '#DC2626';
    }
  };

  const getRouteWidth = (type: EvacuationRoute['type']) => {
    switch (type) {
      case 'primary': return 1.5;
      case 'secondary': return 1.2;
      case 'emergency': return 1.0;
    }
  };

  // Filter API routes by sub-layer settings
  const filteredApiRoutes = apiEvacuationRoutes.filter(route => {
    if (Object.keys(evacuationRoutesSubLayers).length === 0) return true;
    
    if (evacuationRoutesSubLayers['evac-primary'] && route.type === 'primary') return true;
    if (evacuationRoutesSubLayers['evac-secondary'] && route.type === 'secondary') return true;
    if (evacuationRoutesSubLayers['evac-emergency'] && route.type === 'emergency') return true;
    
    return false;
  });

  const apiRoutesGeoJSON = filteredApiRoutes.length > 0 ? {
    type: 'FeatureCollection' as const,
    features: filteredApiRoutes.map(route => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [route.from.lng, route.from.lat],
          [route.to.lng, route.to.lat],
        ],
      },
      properties: {
        routeId: route.routeId,
        type: route.type,
        status: route.status,
        color: getRouteColor(route.status),
        widthMultiplier: getRouteWidth(route.type),
        estimatedTimeMin: route.estimatedTimeMin,
      },
    })),
  } : null;

  // Get unique evacuation centers from routes
  const evacuationCenters = filteredApiRoutes.length > 0
    ? Array.from(new Set(filteredApiRoutes.map(r => `${r.to.lat},${r.to.lng}`))).map(coord => {
        const [lat, lng] = coord.split(',').map(Number);
        const route = filteredApiRoutes.find(r => r.to.lat === lat && r.to.lng === lng)!;
        return {
          lat,
          lng,
          name: route.routeId.split('-').pop()?.replace(/_/g, ' ') || 'Evacuation Center',
          status: route.status,
        };
      })
    : [];

if (__DEV__ && false) { // Set to true only when debugging
  console.log(`🗺️ MapLayers Render:`, {
    evacuationRoutesEnabled,
    apiRoutesCount: apiEvacuationRoutes.length,
    filteredRoutesCount: filteredApiRoutes.length,
    evacuationCentersCount: evacuationCenters.length,
  });
}

  return (
    <>
      {/* Drainage Basins */}
      {drainageBasinsEnabled && (
        <Mapbox.ShapeSource 
          id="drainageBasinsSource" 
          shape={filteredBasinsGeoJSON}
          tolerance={0}
          maxZoomLevel={22}
          buffer={256}
        >
          <Mapbox.LineLayer
            id="drainageBasinsOuterGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: ['get', 'color'],
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 25,
                10, 35,
                14, 50,
                18, 70,
              ],
              lineOpacity: 0.6,
              lineBlur: 25,
            }}
          />
          
          <Mapbox.LineLayer
            id="drainageBasinsInnerGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: ['get', 'color'],
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 15,
                10, 20,
                14, 30,
                18, 45,
              ],
              lineOpacity: 0.8,
              lineBlur: 12,
            }}
          />
          
          <Mapbox.FillLayer
            id="drainageBasinsFill"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              fillColor: ['get', 'color'],
              fillOpacity: 0.55,
            }}
          />
          
          <Mapbox.LineLayer
            id="drainageBasinsBorder"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: ['get', 'color'],
              lineWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 2,
                10, 3,
                14, 5,
                18, 7,
              ],
              lineOpacity: 1.0,
            }}
          />
        </Mapbox.ShapeSource>
      )}

      {/* Flood Zones */}
      {floodZonesEnabled && (
        <Mapbox.ShapeSource 
          id="floodZonesSource" 
          shape={filteredFloodZonesGeoJSON}
          tolerance={0}
          maxZoomLevel={22}
          buffer={256}
        >
          <Mapbox.LineLayer
            id="floodZonesOuterGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#00BFFF',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 25,
                10, 35,
                14, 50,
                18, 70,
              ],
              lineOpacity: 0.6,
              lineBlur: 25,
            }}
          />
          <Mapbox.LineLayer
            id="floodZonesInnerGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#00BFFF',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 15,
                10, 20,
                14, 30,
                18, 45,
              ],
              lineOpacity: 0.8,
              lineBlur: 12,
            }}
          />
          <Mapbox.FillLayer
            id="floodZonesFill"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              fillColor: '#1E90FF',
              fillOpacity: 0.55,
            }}
          />
          <Mapbox.LineLayer
            id="floodZonesBorder"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#00BFFF',
              lineWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 2,
                10, 3,
                14, 5,
                18, 7,
              ],
              lineDasharray: [3, 2],
              lineOpacity: 1.0,
            }}
          />
        </Mapbox.ShapeSource>
      )}

      {/* Landslide Zones */}
      {landslideZonesEnabled && (
        <Mapbox.ShapeSource 
          id="landslideZonesSource" 
          shape={filteredLandslideZonesGeoJSON}
          tolerance={0}
          maxZoomLevel={22}
          buffer={256}
        >
          <Mapbox.LineLayer
            id="landslideZonesOuterGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#FFA500',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 25,
                10, 35,
                14, 50,
                18, 70,
              ],
              lineOpacity: 0.6,
              lineBlur: 25,
            }}
          />
          <Mapbox.LineLayer
            id="landslideZonesInnerGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#FFA500',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 15,
                10, 20,
                14, 30,
                18, 45,
              ],
              lineOpacity: 0.8,
              lineBlur: 12,
            }}
          />
          <Mapbox.FillLayer
            id="landslideZonesFill"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              fillColor: '#FF8C00',
              fillOpacity: 0.55,
            }}
          />
          <Mapbox.LineLayer
            id="landslideZonesBorder"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#FFA500',
              lineWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 2,
                10, 3,
                14, 5,
                18, 7,
              ],
              lineOpacity: 1.0,
            }}
          />
        </Mapbox.ShapeSource>
      )}

{/* API-Based Evacuation Routes - CLEAN GOOGLE MAPS STYLE */}
{evacuationRoutesEnabled && apiRoutesGeoJSON && (
  <>
    <Mapbox.ShapeSource 
      id="apiEvacuationRoutesSource" 
      shape={apiRoutesGeoJSON}
      tolerance={0}
      maxZoomLevel={22}
      buffer={128}
    >
      {/* Subtle outer glow */}
      <Mapbox.LineLayer
        id="apiEvacuationRoutesGlow"
        minZoomLevel={0}
        maxZoomLevel={22}
        style={{
          lineColor: ['get', 'color'],
          lineWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 8,
            10, 10,
            14, 14,
            18, 18,
          ],
          lineCap: "round",
          lineJoin: "round",
          lineOpacity: 0.3,
          lineBlur: 4,
        }}
      />
      
      {/* Main route line - thin and clean */}
      <Mapbox.LineLayer
        id="apiEvacuationRoutesCore"
        minZoomLevel={0}
        maxZoomLevel={22}
        style={{
          lineColor: ['get', 'color'],
          lineWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 3,
            10, 4,
            14, 5,
            18, 7,
          ],
          lineCap: "round",
          lineJoin: "round",
          lineOpacity: 0.9,
        }}
      />
      
      {/* White border for contrast */}
      <Mapbox.LineLayer
        id="apiEvacuationRoutesBorder"
        minZoomLevel={0}
        maxZoomLevel={22}
        style={{
          lineColor: '#FFFFFF',
          lineWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1.5,
            10, 2,
            14, 2.5,
            18, 3.5,
          ],
          lineCap: "round",
          lineJoin: "round",
          lineOpacity: 0.8,
          lineGapWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 3,
            10, 4,
            14, 5,
            18, 7,
          ],
        }}
      />
      
      {/* Animated dashed line for blocked routes */}
      <Mapbox.LineLayer
        id="apiEvacuationRoutesDashed"
        minZoomLevel={0}
        maxZoomLevel={22}
        filter={['==', ['get', 'status'], 'blocked']}
        style={{
          lineColor: '#FFF',
          lineWidth: [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1.5,
            10, 2,
            14, 2.5,
            18, 3,
          ],
          lineDasharray: [0.5, 2],
          lineOpacity: 0.7,
        }}
      />
    </Mapbox.ShapeSource>

    {/* Evacuation Center Markers - Smaller and cleaner */}
    {evacuationCenters.map((center, idx) => (
      <Mapbox.PointAnnotation
        key={`evac-center-${center.lat}-${center.lng}-${idx}`}
        id={`evac-center-${center.lat}-${center.lng}-${idx}`}
        coordinate={[center.lng, center.lat]}
      >
        <View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: center.status === 'clear' ? '#10B981' : center.status === 'congested' ? '#F59E0B' : '#DC2626',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2.5,
          borderColor: '#FFF',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }}>
          <MaterialSymbol name="local_hospital" size={16} color="#FFF" />
        </View>
      </Mapbox.PointAnnotation>
    ))}
  </>
)}



      {/* Fallback: Static Evacuation Routes (if no API routes) */}
      {evacuationRoutesEnabled && !apiRoutesGeoJSON && filteredEvacRoutesGeoJSON.features.length > 0 && (
        <Mapbox.ShapeSource 
          id="evacuationRoutesSource" 
          shape={filteredEvacRoutesGeoJSON}
          tolerance={0}
          maxZoomLevel={22}
          buffer={256}
        >
          <Mapbox.LineLayer
            id="evacuationRoutesGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#00FF00',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 20,
                10, 30,
                14, 45,
                18, 60,
              ],
              lineCap: "round",
              lineJoin: "round",
              lineOpacity: 0.7,
              lineBlur: 18,
            }}
          />
          <Mapbox.LineLayer
            id="evacuationRoutesCore"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              lineColor: '#39FF14',
              lineWidth: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 6,
                10, 10,
                14, 16,
                18, 24,
              ],
              lineCap: "round",
              lineJoin: "round",
              lineOpacity: 1.0,
            }}
          />
        </Mapbox.ShapeSource>
      )}

      {/* Garbage Hotspots */}
      {garbageHotspotsEnabled && (
        <Mapbox.ShapeSource 
          id="garbageHotspotsSource" 
          shape={garbageHotspotsGeoJSON}
          tolerance={0}
          maxZoomLevel={22}
          buffer={256}
        >
          <Mapbox.CircleLayer
            id="garbageHotspotsGlow"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              circleRadius: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 20,
                10, 30,
                14, 45,
                18, 65,
              ],
              circleColor: '#FF6B00',
              circleOpacity: 0.5,
              circleBlur: 2,
            }}
          />
          <Mapbox.CircleLayer
            id="garbageHotspotsCore"
            minZoomLevel={0}
            maxZoomLevel={22}
            style={{
              circleRadius: [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 10,
                10, 15,
                14, 22,
                18, 32,
              ],
              circleColor: '#FF4500',
              circleOpacity: 1.0,
              circleStrokeWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 2,
                10, 4,
                14, 6,
                18, 8,
              ],
              circleStrokeColor: "#FFFFFF",
              circleStrokeOpacity: 1.0,
            }}
          />
        </Mapbox.ShapeSource>
      )}
    </>
  );
};
