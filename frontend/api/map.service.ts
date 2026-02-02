// services/map.service.ts
import apiClient from "./client";
import { Drain } from "../types/drain.types";
import { ApiResponse } from "../types/api.types";

export const mapService = {
  /**
   * Get nearby drains (geospatial)
   */
  async getNearbyDrains(
    lng: number, 
    lat: number, 
    radius: number = 5000
  ): Promise<Drain[]> {
    const { data } = await apiClient.get<ApiResponse<Drain[]>>(
      `/drains/nearby/${lng}/${lat}?radius=${radius}`
    );
    return data.data || [];
  },

  /**
   * Get drains within bounding box
   * Note: You'll need to add this endpoint to backend
   */
  async getDrainsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Drain[]> {
    // TODO: Add this endpoint to backend
    // For now, get all drains and filter client-side
    const { drainService } = await import('./drain.service');
    const allDrains = await drainService.getAllDrains();
    
    return allDrains.filter(drain => {
      const [lng, lat] = drain.location.coordinates;
      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      );
    });
  },

  /**
   * Get drain markers for map (simplified data)
   */
  async getDrainMarkers(): Promise<Array<{
    drainId: number;
    coordinates: [number, number];
    status: string;
    waterLevel: number;
  }>> {
    const { drainService } = await import('./drain.service');
    const drains = await drainService.getAllDrains();
    
    return drains.map(drain => ({
      drainId: drain.drainId,
      coordinates: drain.location.coordinates,
      status: drain.status,
      waterLevel: drain.currentWaterLevel
    }));
  },
};
