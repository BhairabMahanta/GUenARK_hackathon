import apiClient from "./client";

// Drain types
export interface Drain {
  _id: string;
  drainCode: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  basin: string;
  status: "normal" | "warning" | "critical";
  lastReading?: {
    waterLevel: number;
    flowRate: number;
    timestamp: string;
  };
}

// Zone types
export interface Zone {
  _id: string;
  zoneCode: string;
  name: string;
  riskLevel: "low" | "medium" | "high";
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export const floodService = {
  // Drains
  async getAllDrains(): Promise<Drain[]> {
    const { data } = await apiClient.get("/drains");
    return data.drains || data;
  },

  async getCriticalDrains(): Promise<Drain[]> {
    const { data } = await apiClient.get("/drains/critical");
    return data.drains || data;
  },

  async getNearbyDrains(lng: number, lat: number): Promise<Drain[]> {
    const { data } = await apiClient.get(`/drains/nearby/${lng}/${lat}`);
    return data.drains || data;
  },

  // Zones
  async getAllZones(): Promise<Zone[]> {
    const { data } = await apiClient.get("/zones");
    return data.zones || data;
  },

  async getHighRiskZones(): Promise<Zone[]> {
    const { data } = await apiClient.get("/zones/high-risk");
    return data.zones || data;
  },

  async getZoneDetails(id: string): Promise<Zone> {
    const { data } = await apiClient.get(`/zones/${id}/details`);
    return data.zone || data;
  },
};
