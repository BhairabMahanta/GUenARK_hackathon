// backend/src/services/floodPrediction.service.ts (FIXED - NO ERRORS)
import { Drain } from '../models/Drain';
import mongoose from 'mongoose';
import basinGeoJSON from '../data/guwahati_basin.json';
import { routeService } from './routeService';
import { EVACUATION_CENTERS, EvacuationCenter } from '../config/evacuationCenters';

// Interfaces
interface ZoneFloodPrediction {
  timestamp: Date;
  zoneId: string;
  basinId: string;
  zoneFloodTimeHr: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  affectedDrains: number;
  totalCapacityLoss: number;
}

interface BasinFloodPrediction {
  timestamp: Date;
  basinId: string;
  basinFloodTimeHr: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  criticalZones: string[];
  avgWaterLevel: number;
}

interface EvacuationRoute {
  routeId: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  waypoints?: number[][];
  type: 'primary' | 'secondary' | 'emergency';
  status: 'clear' | 'congested' | 'blocked';
  estimatedTimeMin: number;
  affectedByBasins: string[];
}

interface DrainWithMetrics {
  drainId: number;
  name: string;
  basinId: string;
  zoneId: string;
  drainType: string;
  location: any;
  currentWaterLevel: number;
  blockageFactor: number;
  timeToFill: number | null;
  status: string;
  dci: number;
  dcfEff: number;
  degradationRateMr: number;
}

class FloodPredictionService {
  // Configuration
  private readonly ZONE_CAPACITY_LOSS_THRESHOLD = 0.40;
  private readonly MAX_TTF_CAP = 6.0;
  
  private readonly BASIN_CRITICAL_HR = 1.0;
  private readonly BASIN_WARNING_HR = 2.0;
  private readonly BASIN_WATCH_HR = 4.0;
  
  private readonly DRAIN_TYPE_WEIGHTS = {
    small_residential: 1.0,
    medium_road: 2.0,
    large_arterial: 3.0,
  };

  // ============================================
  // MAIN API METHODS
  // ============================================

  async getFloodAlerts() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║      FLOOD PREDICTION SYSTEM - ANALYSIS        ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`⏰ ${new Date().toISOString()}\n`);
    
    const startTime = Date.now();

    const [zonePredictions, basinPredictions, evacuationRoutes] = await Promise.all([
      this.predictZoneFlooding(),
      this.predictBasinFlooding(),
      this.generateEvacuationRoutes(),
    ]);

    const criticalZones = zonePredictions.filter(z => z.riskLevel === 'CRITICAL');
    const criticalBasins = basinPredictions.filter(b => b.riskLevel === 'CRITICAL');
    const alerts = this.generateAlerts(criticalZones, criticalBasins);

    // Logging
    if (criticalZones.length > 0) {
      console.log('\n🚨 CRITICAL ZONES:');
      criticalZones.slice(0, 5).forEach(z => {
        console.log(`   ${z.zoneId}: ${z.zoneFloodTimeHr.toFixed(1)}hr (${z.affectedDrains} drains)`);
      });
    }

    const atRiskBasins = basinPredictions.filter(b => b.riskLevel !== 'NORMAL');
    if (atRiskBasins.length > 0) {
      console.log('\n⚠️  AT-RISK BASINS:');
      atRiskBasins.forEach(b => {
        const icon = b.riskLevel === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`   ${icon} ${b.basinId}: ${b.basinFloodTimeHr.toFixed(1)}hr`);
      });
    }

    const summary = {
      totalZonesAtRisk: zonePredictions.filter(z => z.riskLevel !== 'NORMAL').length,
      criticalZones: criticalZones.length,
      criticalBasins: criticalBasins.length,
      activeEvacuationRoutes: evacuationRoutes.filter(r => r.status === 'clear').length,
    };

    console.log(`\n✅ Completed in ${Date.now() - startTime}ms\n`);

    return {
      timestamp: new Date(),
      summary,
      zones: zonePredictions,
      basins: basinPredictions,
      evacuationRoutes,
      alerts,
    };
  }

  async predictZoneFlooding(): Promise<ZoneFloodPrediction[]> {
    const drains = await this.getDrainsWithMetrics();
    if (drains.length === 0) return [];
    
    const zoneGroups = this.groupByZone(drains);
    const predictions: ZoneFloodPrediction[] = [];

    for (const [zoneId, zoneDrains] of Object.entries(zoneGroups)) {
      const prediction = this.calculateZoneFloodTime(zoneDrains, new Date());
      if (prediction) predictions.push(prediction);
    }

    return predictions.sort((a, b) => a.zoneFloodTimeHr - b.zoneFloodTimeHr);
  }

  async predictBasinFlooding(): Promise<BasinFloodPrediction[]> {
    const drains = await this.getDrainsWithMetrics();
    if (drains.length === 0) return [];
    
    const basinGroups = this.groupByBasin(drains);
    const predictions: BasinFloodPrediction[] = [];

    for (const [basinId, basinDrains] of Object.entries(basinGroups)) {
      const prediction = await this.calculateBasinFloodTime(basinDrains, new Date());
      if (prediction) predictions.push(prediction);
    }

    return predictions.sort((a, b) => a.basinFloodTimeHr - b.basinFloodTimeHr);
  }

  // ============================================
  // SIMPLIFIED EVACUATION ROUTES
  // ============================================

  async generateEvacuationRoutes(): Promise<EvacuationRoute[]> {
    const basinPredictions = await this.predictBasinFlooding();
    const criticalBasins = basinPredictions.filter(
      p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'WARNING'
    );
    
    if (criticalBasins.length === 0) {
      console.log('✅ No evacuation needed');
      return [];
    }

    console.log(`🛣️  Generating evacuation routes for ${criticalBasins.length} at-risk basins...`);

    const routes: EvacuationRoute[] = [];
    const basinCenters = this.getBasinCenters();

    // For each critical basin, find nearest evacuation center
    for (const basin of criticalBasins) {
      const basinCenter = basinCenters[basin.basinId];
      if (!basinCenter) continue;

      // Find 2 nearest evacuation centers
      const nearest = EVACUATION_CENTERS
        .map((center: EvacuationCenter) => ({
          center,
          distance: this.calculateDistance(
            basinCenter.lat, basinCenter.lng,
            center.lat, center.lng
          ),
        }))
        .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
        .slice(0, 2);

      // Generate routes to 2 nearest centers
      for (let i = 0; i < nearest.length; i++) {
        const { center, distance } = nearest[i];
        
        // Fetch real route from Mapbox
        const mapboxRoute = await routeService.fetchRoute(basinCenter, center);
        
        const route: EvacuationRoute = {
          routeId: `${basin.basinId}-${center.id}`,
          from: basinCenter,
          to: { lat: center.lat, lng: center.lng },
          waypoints: mapboxRoute?.coordinates,
          type: i === 0 ? 'primary' : 'secondary',
          status: this.determineRouteStatus(basin, distance),
          estimatedTimeMin: mapboxRoute?.duration || Math.round(distance * 5),
          affectedByBasins: [basin.basinId],
        };

        routes.push(route);
        await this.sleep(50); // Rate limit
      }
    }

    console.log(`✅ ${routes.length} routes generated`);
    return routes;
  }

  // ============================================
  // DATA FETCHING
  // ============================================

  private async getDrainsWithMetrics(): Promise<DrainWithMetrics[]> {
    const drains = (await Drain.find({}).lean()) as any[];
    if (drains.length === 0) return [];

    const db = mongoose.connection.db!;

    const [dciMetrics, healthMetrics] = await Promise.all([
      db.collection('dcitimeseries').aggregate([
        { $sort: { drainId: 1, timestamp: -1 } },
        { $group: {
          _id: '$drainId',
          latestDci: { $first: '$dci' },
          latestDcfEff: { $first: '$dcfEff' },
        }}
      ]).toArray() as Promise<any[]>,
      db.collection('drainhealthtimeseries').aggregate([
        { $sort: { drainId: 1, timestamp: -1 } },
        { $group: {
          _id: '$drainId',
          latestDegradationRate: { $first: '$degradationRateMr' },
        }}
      ]).toArray() as Promise<any[]>
    ]);

    const dciMap = new Map(dciMetrics.map((m: any) => [m._id, m]));
    const healthMap = new Map(healthMetrics.map((m: any) => [m._id, m]));

    return drains.map(drain => {
      const dci = dciMap.get(drain.drainId)?.latestDci ?? 0.5;
      const dcfEff = dciMap.get(drain.drainId)?.latestDcfEff ?? 0.5;
      const degradationRate = healthMap.get(drain.drainId)?.latestDegradationRate ?? 0;

      let status = 'safe';
      let timeToFill = 360;

      if (dci < 0.3 || dcfEff < 0.3) { status = 'critical'; timeToFill = 30; }
      else if (dci < 0.5 || dcfEff < 0.5) { status = 'warning'; timeToFill = 90; }
      else if (dci < 0.7 || dcfEff < 0.7) { status = 'watch'; timeToFill = 180; }

      return {
        drainId: drain.drainId,
        name: drain.name || `Drain ${drain.drainId}`,
        basinId: drain.basinId,
        zoneId: drain.zoneId,
        drainType: drain.drainType || 'medium_road',
        location: drain.location,
        currentWaterLevel: drain.currentWaterLevel || 0,
        status,
        timeToFill,
        dci,
        dcfEff,
        degradationRateMr: degradationRate,
        blockageFactor: Math.max(0.1, 1 - dcfEff),
      };
    });
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  private calculateZoneFloodTime(drains: DrainWithMetrics[], timestamp: Date): ZoneFloodPrediction | null {
    if (drains.length === 0) return null;

    const drainData = drains.map(d => ({
      weight: (this.DRAIN_TYPE_WEIGHTS[d.drainType as keyof typeof this.DRAIN_TYPE_WEIGHTS] || 1.0) * d.blockageFactor,
      ttf: Math.min((d.timeToFill || 360) / 60, this.MAX_TTF_CAP),
    })).sort((a, b) => a.ttf - b.ttf);

    const totalCapacity = drainData.reduce((sum, d) => sum + d.weight, 0);
    let cumulativeLoss = 0;
    let zoneFloodTime = this.MAX_TTF_CAP;

    for (const data of drainData) {
      cumulativeLoss += data.weight;
      if (cumulativeLoss / totalCapacity >= this.ZONE_CAPACITY_LOSS_THRESHOLD) {
        zoneFloodTime = data.ttf;
        break;
      }
    }

    let riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
    if (zoneFloodTime <= 0.5) riskLevel = 'CRITICAL';
    else if (zoneFloodTime <= 1.5) riskLevel = 'WARNING';
    else if (zoneFloodTime <= 3.0) riskLevel = 'WATCH';
    else riskLevel = 'NORMAL';

    return {
      timestamp,
      zoneId: drains[0].zoneId,
      basinId: drains[0].basinId,
      zoneFloodTimeHr: parseFloat(zoneFloodTime.toFixed(3)),
      riskLevel,
      affectedDrains: drains.length,
      totalCapacityLoss: parseFloat((cumulativeLoss / totalCapacity).toFixed(3)),
    };
  }

  private async calculateBasinFloodTime(drains: DrainWithMetrics[], timestamp: Date): Promise<BasinFloodPrediction | null> {
    if (drains.length === 0) return null;

    let totalWeight = 0;
    let weightedTimeSum = 0;

    for (const drain of drains) {
      const weight = (this.DRAIN_TYPE_WEIGHTS[drain.drainType as keyof typeof this.DRAIN_TYPE_WEIGHTS] || 1.0) * drain.blockageFactor;
      const ttf = Math.min((drain.timeToFill || 360) / 60, this.MAX_TTF_CAP);
      totalWeight += weight;
      weightedTimeSum += weight * ttf;
    }

    const basinFloodTime = totalWeight > 0 ? weightedTimeSum / totalWeight : this.MAX_TTF_CAP;

    let riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
    if (basinFloodTime <= this.BASIN_CRITICAL_HR) riskLevel = 'CRITICAL';
    else if (basinFloodTime <= this.BASIN_WARNING_HR) riskLevel = 'WARNING';
    else if (basinFloodTime <= this.BASIN_WATCH_HR) riskLevel = 'WATCH';
    else riskLevel = 'NORMAL';

    return {
      timestamp,
      basinId: drains[0].basinId,
      basinFloodTimeHr: parseFloat(basinFloodTime.toFixed(3)),
      riskLevel,
      criticalZones: [...new Set(drains.filter(d => d.status !== 'safe').map(d => d.zoneId))],
      avgWaterLevel: drains.reduce((sum, d) => sum + (d.currentWaterLevel || 0), 0) / drains.length,
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  private getBasinCenters(): Record<string, { lat: number; lng: number }> {
    const centers: Record<string, { lat: number; lng: number }> = {};
    
    for (const feature of (basinGeoJSON as any).features) {
      if (feature.geometry.type !== 'Polygon') continue;
      
      const points = feature.geometry.coordinates[0];
      const lat = points.reduce((sum: number, p: number[]) => sum + p[1], 0) / points.length;
      const lng = points.reduce((sum: number, p: number[]) => sum + p[0], 0) / points.length;
      
      let name = feature.properties.name.replace(' Basin', '').replace(/\s+/g, '_');
      if (name === 'Morabiharalu') name = 'Morabharalu';
      
      centers[name] = { lat, lng };
    }
    
    return centers;
  }

  private groupByZone(drains: DrainWithMetrics[]): Record<string, DrainWithMetrics[]> {
    return drains.reduce((acc, d) => {
      (acc[d.zoneId] = acc[d.zoneId] || []).push(d);
      return acc;
    }, {} as Record<string, DrainWithMetrics[]>);
  }

  private groupByBasin(drains: DrainWithMetrics[]): Record<string, DrainWithMetrics[]> {
    return drains.reduce((acc, d) => {
      (acc[d.basinId] = acc[d.basinId] || []).push(d);
      return acc;
    }, {} as Record<string, DrainWithMetrics[]>);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  private determineRouteStatus(basin: BasinFloodPrediction, distance: number): 'clear' | 'congested' | 'blocked' {
    if (basin.riskLevel === 'CRITICAL' && distance < 2) return 'blocked';
    if (basin.riskLevel === 'CRITICAL') return 'congested';
    return 'clear';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateAlerts(criticalZones: ZoneFloodPrediction[], criticalBasins: BasinFloodPrediction[]) {
    return [
      ...criticalZones.map(z => ({
        type: 'ZONE_FLOOD_WARNING',
        severity: 'HIGH',
        message: `Zone ${z.zoneId} flooding in ${z.zoneFloodTimeHr.toFixed(1)}hr`,
        zoneId: z.zoneId,
        basinId: z.basinId,
        timestamp: z.timestamp,
      })),
      ...criticalBasins.map(b => ({
        type: 'BASIN_FLOOD_WARNING',
        severity: 'CRITICAL',
        message: `Basin ${b.basinId} critical - evacuate zones: ${b.criticalZones.join(', ')}`,
        basinId: b.basinId,
        zones: b.criticalZones,
        timestamp: b.timestamp,
      }))
    ];
  }
}

export const floodPredictionService = new FloodPredictionService();
