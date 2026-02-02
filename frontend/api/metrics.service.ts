// services/metrics.service.ts
import apiClient from "./client";
import { DciTimeseries, HealthTimeseries, ChartDataPoint } from "../types/metrics.types";
import { ApiResponse } from "../types/api.types";

export const metricsService = {
  /**
   * Get DCI timeseries for a drain
   * Note: You'll need to add this endpoint to backend
   */
  async getDciTimeseries(drainId: number, hours: number = 24): Promise<DciTimeseries[]> {
    // TODO: Add this endpoint to backend
    // For now, return empty array
    return [];
    
    // Future implementation:
    // const { data } = await apiClient.get<ApiResponse<DciTimeseries[]>>(
    //   `/metrics/${drainId}/dci?hours=${hours}`
    // );
    // return data.data || [];
  },

  /**
   * Get health timeseries for a drain
   * Note: You'll need to add this endpoint to backend
   */
  async getHealthTimeseries(drainId: number, hours: number = 24): Promise<HealthTimeseries[]> {
    // TODO: Add this endpoint to backend
    return [];
  },

  /**
   * Get DCI for chart display
   */
  async getDciForChart(drainId: number, hours: number = 24): Promise<ChartDataPoint[]> {
    const timeseries = await this.getDciTimeseries(drainId, hours);
    return timeseries.map(t => ({
      timestamp: t.timestamp,
      value: t.dci,
      label: 'DCI'
    }));
  },

  /**
   * Get degradation rate for chart
   */
  async getDegradationForChart(drainId: number, hours: number = 24): Promise<ChartDataPoint[]> {
    const timeseries = await this.getHealthTimeseries(drainId, hours);
    return timeseries.map(t => ({
      timestamp: t.timestamp,
      value: t.degradationRateHr || 0,
      label: 'Degradation Rate'
    }));
  },
};
