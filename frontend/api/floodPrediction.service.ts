// frontend/api/floodPrediction.service.ts (FIX PATHS)
import apiClient from "./client";

export interface ZoneFloodPrediction {
  timestamp: Date;
  zoneId: string;
  basinId: string;
  zoneFloodTimeHr: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  affectedDrains: number;
  totalCapacityLoss: number;
}

export interface BasinFloodPrediction {
  timestamp: Date;
  basinId: string;
  basinFloodTimeHr: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  criticalZones: string[];
  avgWaterLevel: number;
}

export interface EvacuationRoute {
  routeId: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  type: 'primary' | 'secondary' | 'emergency';
  status: 'clear' | 'congested' | 'blocked';
  estimatedTimeMin: number;
  affectedByBasins: string[];
}

export interface FloodAlert {
  timestamp: Date;
  summary: {
    totalZonesAtRisk: number;
    criticalZones: number;
    criticalBasins: number;
    activeEvacuationRoutes: number;
  };
  zones: ZoneFloodPrediction[];
  basins: BasinFloodPrediction[];
  evacuationRoutes: EvacuationRoute[];
  alerts: {
    type: string;
    severity: string;
    message: string;
    zoneId?: string;
    basinId?: string;
    zones?: string[];
    timestamp: Date;
  }[];
}

export const floodPredictionService = {

  // Since baseURL is already http://10.0.2.2:5005/api/flood
  // This will call: /api/flood/predictions/alerts
  
  async getFloodAlerts(): Promise<FloodAlert> {
    const { data } = await apiClient.get("/predictions/alerts");
    return data;
  },

  async getZonePredictions(): Promise<ZoneFloodPrediction[]> {
    const { data } = await apiClient.get("/predictions/zones");
    return data;
  },

  async getBasinPredictions(): Promise<BasinFloodPrediction[]> {
    const { data } = await apiClient.get("/predictions/basins");
    return data;
  },

  async getEvacuationRoutes(): Promise<EvacuationRoute[]> {
    const { data } = await apiClient.get("/predictions/evacuation-routes");
    return data;
  },
};
