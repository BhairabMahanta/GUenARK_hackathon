// backend/src/services/routeService.ts
import axios from 'axios';

interface CachedRoute {
  coordinates: number[][];
  duration: number;
  timestamp: Date;
}

export class RouteService {
  private routeCache = new Map<string, CachedRoute>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private getCacheKey(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
    return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}-${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  }

  // Haversine formula for fallback
  private calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private estimateDuration(distanceKm: number): number {
    const avgSpeedKmh = 40;
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  }

  async fetchRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{ coordinates: number[][]; duration: number } | null> {
    // Check cache
    const cacheKey = this.getCacheKey(from, to);
    const cached = this.routeCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_TTL_MS) {
      console.log('[ROUTE] Using cached route');
      return { coordinates: cached.coordinates, duration: cached.duration };
    }

    try {
      // OSRM public API - FREE and unlimited
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`;
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
        },
        timeout: 5000,
      });

      if (response.data.routes?.[0]) {
        const route = response.data.routes[0];
        const result = {
          coordinates: route.geometry.coordinates,
          duration: Math.round(route.duration / 60), // Convert to minutes
        };

        this.routeCache.set(cacheKey, { ...result, timestamp: new Date() });
        console.log(`[ROUTE] OSRM route: ${route.distance.toFixed(0)}m, ${result.duration}min`);
        return result;
      }
    } catch (error: any) {
      console.error(`[ROUTE] OSRM error: ${error.message}`);
    }

    // Fallback to straight line with estimated duration
    const distance = this.calculateDistance(from, to);
    const duration = this.estimateDuration(distance);
    
    console.log(`[ROUTE] Fallback route: ${distance.toFixed(2)}km, ~${duration}min`);
    return {
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
      duration,
    };
  }
}

export const routeService = new RouteService();
