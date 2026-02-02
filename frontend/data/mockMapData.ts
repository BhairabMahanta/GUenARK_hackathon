// data/mockMapData.ts (COMPLETE REPLACEMENT)
import { FeatureCollection, Polygon, LineString, Point, MultiPolygon } from "geojson";


// ============================================
// MAP CENTER COORDINATES
// ============================================
export const GUWAHATI_CENTER = {
  longitude: 91.7362,
  latitude: 26.185,
};


export const MOCK_USER_LOCATION = {
  latitude: 26.1445,
  longitude: 91.7362,
};


// ============================================
// FLOOD RISK ZONES (Refined based on basin data)
// ============================================
export const floodZonesGeoJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "bharalu-flood-zone-1",
        name: "Bharalu Critical Zone",
        risk: "high",
        description: "Fancy Bazar, Pan Bazar - chronic flooding during monsoon",
        population: 15000,
        historicalFloods: 8,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.722, 26.185], // Fancy Bazar core
            [91.732, 26.188],
            [91.735, 26.183],
            [91.728, 26.178],
            [91.720, 26.180],
            [91.722, 26.185],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "bharalumukh-zone",
        name: "Bharalumukh Confluence",
        risk: "high",
        description: "Where Bharalu meets Brahmaputra - backflow risk",
        population: 8000,
        historicalFloods: 10,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.708, 26.175],
            [91.715, 26.178],
            [91.715, 26.185],
            [91.708, 26.183],
            [91.708, 26.175],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "brahmaputra-floodplain",
        name: "Brahmaputra Floodplain",
        risk: "high",
        description: "North Guwahati riverbank - high flood risk during monsoon",
        population: 25000,
        historicalFloods: 12,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.710, 26.205],
            [91.750, 26.210],
            [91.750, 26.202],
            [91.710, 26.200],
            [91.710, 26.205],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "zoo-road-zone",
        name: "Zoo Road Area",
        risk: "medium",
        description: "Hillside drainage overflow from Kharghuli hills",
        population: 8000,
        historicalFloods: 5,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.755, 26.183],
            [91.765, 26.186],
            [91.765, 26.178],
            [91.755, 26.176],
            [91.755, 26.183],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "beltola-zone",
        name: "Beltola Low-lying Area",
        risk: "medium",
        description: "Bahini basin - poor drainage infrastructure",
        population: 12000,
        historicalFloods: 6,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.755, 26.150],
            [91.765, 26.155],
            [91.765, 26.145],
            [91.755, 26.143],
            [91.755, 26.150],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "deepor-beel-zone",
        name: "Deepor Beel Wetland",
        risk: "medium",
        description: "Protected wetland - natural flood buffer, can overflow",
        population: 5000,
        historicalFloods: 4,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.695, 26.140],
            [91.710, 26.145],
            [91.710, 26.155],
            [91.695, 26.158],
            [91.695, 26.140],
          ],
        ],
      },
    },
  ],
};


// ============================================
// LANDSLIDE ZONES (360+ mapped) - Orange zones from your map
// ============================================
export const landslideZonesGeoJSON: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "sunsali-hillside",
        name: "Sunsali Hill Slope",
        risk: "high",
        description: "Steep terrain - heavy rain triggers slides",
        affectedArea: "1.2 km²",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.745, 26.190],
            [91.755, 26.195],
            [91.758, 26.188],
            [91.750, 26.185],
            [91.745, 26.190],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "kharghuli-hills",
        name: "Kharghuli Hill Area",
        risk: "high",
        description: "Unstable soil - frequent landslides (visible in your map)",
        affectedArea: "0.8 km²",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.770, 26.188],
            [91.782, 26.192],
            [91.785, 26.185],
            [91.775, 26.182],
            [91.770, 26.188],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "zoo-road-hillside",
        name: "Zoo Road Hill Slope",
        risk: "high",
        description: "Visible orange zone in your map - monitor during monsoon",
        affectedArea: "0.5 km²",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.758, 26.180],
            [91.768, 26.184],
            [91.770, 26.176],
            [91.760, 26.174],
            [91.758, 26.180],
          ],
        ],
      },
    },
  ],
};


// ============================================
// GARBAGE HOTSPOTS (AI-verified community reports)
// ============================================
export const garbageHotspotsGeoJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "garbage-1",
        name: "Fancy Bazar Drain Blockage",
        severity: "critical",
        reports: 47,
        lastVerified: "2026-01-29T14:30:00Z",
        drainId: 23,
      },
      geometry: {
        type: "Point",
        coordinates: [91.728, 26.187],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "garbage-2",
        name: "Pan Bazar Junction",
        severity: "high",
        reports: 32,
        lastVerified: "2026-01-30T09:15:00Z",
        drainId: 45,
      },
      geometry: {
        type: "Point",
        coordinates: [91.723, 26.183],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "garbage-3",
        name: "Beltola Main Road",
        severity: "medium",
        reports: 18,
        lastVerified: "2026-01-28T16:45:00Z",
        drainId: 89,
      },
      geometry: {
        type: "Point",
        coordinates: [91.760, 26.152],
      },
    },
  ],
};


// ============================================
// SAFE EVACUATION ROUTES (AI-optimized, OFF by default)
// ============================================
export const evacuationRoutesGeoJSON: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "route-primary-1",
        name: "Primary Evacuation Route - GS Road",
        type: "primary",
        status: "active",
        capacity: "high",
        estimatedTime: "25 mins",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [91.7362, 26.185],
          [91.7412, 26.188],
          [91.7462, 26.191],
          [91.7512, 26.194],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "route-secondary-1",
        name: "Secondary Route - Maligaon Path",
        type: "secondary",
        status: "active",
        capacity: "medium",
        estimatedTime: "20 mins",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [91.7362, 26.185],
          [91.7312, 26.182],
          [91.7262, 26.179],
          [91.7212, 26.176],
        ],
      },
    },
  ],
};


// ============================================
// DRAIN STATUS COLORS
// ============================================
export const DRAIN_STATUS_COLORS = {
  safe: "#10B981",      // Green
  watch: "#F59E0B",     // Yellow
  warning: "#FB923C",   // Orange
  critical: "#EF4444",  // Red
  offline: "#6B7280",   // Gray
};


export const getDrainStatusColor = (status: string): string => {
  return DRAIN_STATUS_COLORS[status as keyof typeof DRAIN_STATUS_COLORS] || DRAIN_STATUS_COLORS.offline;
};


// ============================================
// LAYER CONFIGURATION (Categorized)
// ============================================
// data/mockMapData.ts (UPDATE LAYER CONFIG)

// ============================================
// LAYER CONFIGURATION (with Sub-layers Support)
// ============================================
export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  enabled: boolean;
  subLayers?: SubLayer[];
}

export interface SubLayer {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  parentId: string;
}

export const layerConfig: LayerConfig[] = [
  // === INFRASTRUCTURE LAYERS ===
  {
    id: "drainage-basins",
    name: "Drainage Basins",
    description: "8 major drainage basins across Guwahati",
    icon: "water_drop" as const,
    color: "#3B82F6",
    category: "infrastructure",
    enabled: false,
    subLayers: [
      { id: "dipor-beel", name: "Dipor Beel Basin", color: "#4CAF50", enabled: true, parentId: "drainage-basins" },
      { id: "morabiharalu", name: "Morabiharalu Basin", color: "#2196F3", enabled: true, parentId: "drainage-basins" },
      { id: "bahini", name: "Bahini Basin", color: "#FF9800", enabled: true, parentId: "drainage-basins" },
      { id: "silsako", name: "Silsako Basin", color: "#E91E63", enabled: true, parentId: "drainage-basins" },
      { id: "bharalu", name: "Bharalu Basin", color: "#9C27B0", enabled: true, parentId: "drainage-basins" },
      { id: "basistha", name: "Basistha Basin", color: "#00BCD4", enabled: true, parentId: "drainage-basins" },
      { id: "noonmati", name: "Noonmati Basin", color: "#FFC107", enabled: true, parentId: "drainage-basins" },
      { id: "haimala", name: "Harimala Basin", color: "#795548", enabled: true, parentId: "drainage-basins" },
    ],
  },
  {
    id: "drain-status",
    name: "Drain Status",
    description: "Real-time drainage system (143 drains)",
    icon: "work" as const,
    color: "#F59E0B",
    category: "infrastructure",
    enabled: true,
    subLayers: [
      { id: "drain-critical", name: "Critical Drains", color: "#EF4444", enabled: true, parentId: "drain-status" },
      { id: "drain-warning", name: "Warning Drains", color: "#FB923C", enabled: false, parentId: "drain-status" },
      { id: "drain-watch", name: "Watch Drains", color: "#F59E0B", enabled: false, parentId: "drain-status" },
      { id: "drain-safe", name: "Safe Drains", color: "#10B981", enabled: false, parentId: "drain-status" },
      { id: "drain-offline", name: "Offline Drains", color: "#6B7280", enabled: false, parentId: "drain-status" },
    ],
  },
  {
    id: "garbage-hotspots",
    name: "Garbage Hotspots",
    description: "AI-verified blockages",
    icon: "delete" as const,
    color: "#DC2626",
    category: "infrastructure",
    enabled: false,
  },

  // === HAZARD LAYERS ===
  {
    id: "flood-zones",
    name: "Flood Risk Zones",
    description: "High-risk flooding areas",
    icon: "warning" as const,
    color: "#EF4444",
    category: "hazards",
    enabled: false,
    subLayers: [
      { id: "flood-high", name: "High Risk", color: "#DC2626", enabled: true, parentId: "flood-zones" },
      { id: "flood-medium", name: "Medium Risk", color: "#F59E0B", enabled: true, parentId: "flood-zones" },
      { id: "flood-low", name: "Low Risk", color: "#FCD34D", enabled: true, parentId: "flood-zones" },
    ],
  },
  {
    id: "landslide-zones",
    name: "Landslide Zones",
    description: "360+ hillside risk areas",
    icon: "thunderstorm" as const,
    color: "#F97316",
    category: "hazards",
    enabled: false,
    subLayers: [
      { id: "landslide-severe", name: "Severe Risk", color: "#DC2626", enabled: true, parentId: "landslide-zones" },
      { id: "landslide-moderate", name: "Moderate Risk", color: "#F97316", enabled: true, parentId: "landslide-zones" },
    ],
  },

  // === EMERGENCY LAYERS ===
  {
    id: "evacuation-routes",
    name: "Evacuation Routes",
    description: "AI-optimized safe paths",
    icon: "route" as const,
    color: "#10B981",
    category: "emergency",
    enabled: true,
    subLayers: [
      { id: "evac-primary", name: "Primary Routes", color: "#10B981", enabled: true, parentId: "evacuation-routes" },
      { id: "evac-secondary", name: "Secondary Routes", color: "#34D399", enabled: true, parentId: "evacuation-routes" },
      { id: "evac-emergency", name: "Emergency Routes", color: "#FCD34D", enabled: false, parentId: "evacuation-routes" },
    ],
  },
];


// ============================================
// LAYER COLORS (for styling)
// ============================================
export const LAYER_COLORS = {
  FLOOD_ZONE: "#EF4444",
  LANDSLIDE_ZONE: "#F97316",
  EVACUATION_ROUTE: "#10B981",


  GARBAGE_HOTSPOT: "#DC2626",
  DRAIN_CRITICAL: "#EF4444",
  DRAIN_WARNING: "#FB923C",
  DRAIN_WATCH: "#F59E0B",
  DRAIN_SAFE: "#10B981",
  DRAIN_OFFLINE: "#6B7280",
};
