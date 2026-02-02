// services/drain.service.ts
import apiClient from "./client";
import { Drain, DrainFilters, DrainMetrics } from "../types/drain.types";
import { ApiResponse } from "../types/api.types";

export const drainService = {
  /**
   * Get all drains with optional filters
   */
  async getAllDrains(filters?: DrainFilters): Promise<Drain[]> {
    const params = new URLSearchParams();
    if (filters?.basinId) params.append('basinId', filters.basinId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.zoneId) params.append('zoneId', filters.zoneId);

    const { data } = await apiClient.get<ApiResponse<Drain[]>>(
      `/drains?${params.toString()}`
    );
    return data.data || [];
  },

  /**
   * Get single drain by ID
   */
  async getDrainById(drainId: number): Promise<Drain> {
    const { data } = await apiClient.get<ApiResponse<Drain>>(`/drains/${drainId}`);
    return data.data!;
  },

  /**
   * Get drain metrics (DCI, stress index, etc.)
   */
  async getDrainMetrics(drainId: number): Promise<DrainMetrics> {
    const { data } = await apiClient.get<ApiResponse<DrainMetrics>>(
      `/drains/${drainId}/metrics`
    );
    return data.data!;
  },

  /**
   * Get critical drains (for alerts)
   */
  async getCriticalDrains(limit: number = 20): Promise<Drain[]> {
    const { data } = await apiClient.get<ApiResponse<Drain[]>>(
      `/drains/critical?limit=${limit}`
    );
    return data.data || [];
  },

  /**
   * Get drains by basin
   */
  async getDrainsByBasin(basinId: string): Promise<Drain[]> {
    const { data } = await apiClient.get<ApiResponse<Drain[]>>(
      `/drains/basin/${basinId}`
    );
    return data.data || [];
  },

  /**
   * Get drains by zone
   */
  async getDrainsByZone(zoneId: string): Promise<Drain[]> {
    const { data } = await apiClient.get<ApiResponse<Drain[]>>(
      `/drains/zone/${zoneId}`
    );
    return data.data || [];
  },

  /**
   * Search drains (client-side for now, can be backend later)
   */
  async searchDrains(query: string): Promise<Drain[]> {
    const allDrains = await this.getAllDrains();
    const lowerQuery = query.toLowerCase();
    
    return allDrains.filter(drain => 
      drain.drainId.toString().includes(lowerQuery) ||
      drain.name?.toLowerCase().includes(lowerQuery) ||
      drain.basinId.toLowerCase().includes(lowerQuery) ||
      drain.zoneId.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Update drain with sensor data (for testing)
   */
  async updateSensorData(
    drainId: number, 
    sensorData: {
      waterLevel: number;
      turbidity?: number;
      flowRate?: number;
      rainfall?: number;
    }
  ): Promise<Drain> {
    const { data } = await apiClient.post<ApiResponse<Drain>>(
      `/drains/${drainId}/sensor-data`,
      sensorData
    );
    return data.data!;
  },

  /**
   * Get drains grouped by status
   */
  async getDrainsByStatus(): Promise<Record<string, Drain[]>> {
    const drains = await this.getAllDrains();
    return drains.reduce((acc, drain) => {
      if (!acc[drain.status]) acc[drain.status] = [];
      acc[drain.status].push(drain);
      return acc;
    }, {} as Record<string, Drain[]>);
  },

  /**
   * Get drains grouped by basin
   */
  async getDrainsByBasinGrouped(): Promise<Record<string, Drain[]>> {
    const drains = await this.getAllDrains();
    return drains.reduce((acc, drain) => {
      if (!acc[drain.basinId]) acc[drain.basinId] = [];
      acc[drain.basinId].push(drain);
      return acc;
    }, {} as Record<string, Drain[]>);
  },
};
