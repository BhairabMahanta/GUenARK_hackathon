// services/sensor.service.ts (COMPLETE)
import apiClient from "./client";
import { SensorReading, ReadingStats, LatestReading, BasinAggregate } from "../types/sensor.types";
import { ApiResponse } from "../types/api.types";

export const sensorService = {
  /**
   * Get readings for a specific drain
   */
  async getDrainReadings(drainId: number, hours: number = 24): Promise<SensorReading[]> {
    const { data } = await apiClient.get<ApiResponse<SensorReading[]>>(
      `/sensors/drain/${drainId}?hours=${hours}`
    );
    return data.data || [];
  },

  /**
   * Get reading statistics for a drain
   */
  async getReadingStats(drainId: number, hours: number = 24): Promise<ReadingStats> {
    const { data } = await apiClient.get<ApiResponse<ReadingStats>>(
      `/sensors/drain/${drainId}/stats?hours=${hours}`
    );
    return data.data!;
  },

  /**
   * Get all latest readings (for map view)
   */
  async getAllLatestReadings(): Promise<SensorReading[]> {
    const { data } = await apiClient.get<ApiResponse<SensorReading[]>>(
      `/sensors/latest`
    );
    return data.data || [];
  },

  /**
   * Get latest readings for multiple drains
   */
  async getLatestReadingsByDrains(drainIds: number[]): Promise<LatestReading[]> {
    const { data } = await apiClient.get<ApiResponse<LatestReading[]>>(
      `/sensors/latest/multiple?drainIds=${drainIds.join(',')}`
    );
    return data.data || [];
  },

  /**
   * Get basin aggregate statistics
   */
  async getBasinAggregate(basinId: string): Promise<BasinAggregate> {
    const { data } = await apiClient.get<ApiResponse<BasinAggregate>>(
      `/sensors/basin/${basinId}/aggregate`
    );
    return data.data!;
  },

  /**
   * Save sensor reading (for testing/demo)
   */
  async saveSensorReading(reading: {
    drainId: number;
    waterLevel: number;
    rainfall?: number;
    flowRate?: number;
    turbidity?: number;
    metadata?: any;
  }): Promise<SensorReading> {
    const { data } = await apiClient.post<ApiResponse<SensorReading>>(
      `/sensors/readings`,
      reading
    );
    return data.data!;
  },

  /**
   * Get readings for chart (formatted for charting library)
   */
  async getReadingsForChart(drainId: number, hours: number = 24) {
    const readings = await this.getDrainReadings(drainId, hours);
    
    return {
      waterLevel: readings.map(r => ({
        timestamp: r.timestamp,
        value: r.waterLevelPercent
      })),
      flowRate: readings.map(r => ({
        timestamp: r.timestamp,
        value: r.flowRateLps
      })),
      turbidity: readings.map(r => ({
        timestamp: r.timestamp,
        value: r.turbidityNtu
      })),
      rainfall: readings.map(r => ({
        timestamp: r.timestamp,
        value: r.rainfallMmPerHour
      }))
    };
  },
};
