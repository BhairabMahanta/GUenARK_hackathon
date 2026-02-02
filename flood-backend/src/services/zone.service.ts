import Zone, { IZone } from '../models/Zone';
import Drain from '../models/Drain';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

class ZoneService {
  // ==================== CRUD Operations ====================
  
  async getAllZones() {
    return await Zone.find().lean();
  }

  async getZoneById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid zone ID', 400);
    }
    
    const zone = await Zone.findById(id).lean();
    if (!zone) throw new AppError('Zone not found', 404);
    
    return zone;
  }

  async getZoneByCode(zoneCode: string) {
    const zone = await Zone.findOne({ zoneCode }).lean();
    if (!zone) throw new AppError('Zone not found', 404);
    
    return zone;
  }

  async createZone(data: Partial<IZone>) {
    if (!data.zoneCode || !data.name || !data.boundary) {
      throw new AppError('Missing required zone fields', 400);
    }

    return await Zone.create(data);
  }

  // ==================== Zone Aggregation Logic ====================
  
  /**
   * Update zone statistics by aggregating all drains in the zone
   * This is called after any drain update
   */
  async updateZoneStats(zoneId: string) {
    const zone = await Zone.findById(zoneId);
    if (!zone) throw new AppError('Zone not found', 404);

    // Get all drains in this zone
    const drains = await Drain.find({ zoneId });

    if (drains.length === 0) {
      zone.zoneStats = {
        avgStress: 0,
        avgTimeToFill: null,
        criticalDrainCount: 0,
        totalDrains: 0,
        lastCalculated: new Date()
      };
      zone.riskScore = 0;
      await zone.save();
      return zone;
    }

    // Calculate zone statistics
    const totalDrains = drains.length;
    let totalStress = 0;
    let totalTimeToFill = 0;
    let drainsWithTimeToFill = 0;
    let criticalDrainCount = 0;

    for (const drain of drains) {
      totalStress += drain.stressIndex;

      if (drain.timeToFill !== null && drain.timeToFill > 0) {
        totalTimeToFill += drain.timeToFill;
        drainsWithTimeToFill++;
      }

      if (drain.status === 'critical' || drain.status === 'warning') {
        criticalDrainCount++;
      }
    }

    // Update zone stats
    zone.zoneStats = {
      avgStress: totalStress / totalDrains,
      avgTimeToFill: drainsWithTimeToFill > 0 ? totalTimeToFill / drainsWithTimeToFill : null,
      criticalDrainCount,
      totalDrains,
      lastCalculated: new Date()
    };

    // Calculate composite zone risk score
    zone.riskScore = this.calculateZoneRiskScore(zone.zoneStats);

    await zone.save();
    return zone;
  }

  /**
   * Calculate zone risk score (0-100)
   */
  private calculateZoneRiskScore(stats: any): number {
    let risk = 0;

    // Factor 1: Average stress (50% weight)
    risk += stats.avgStress * 0.5;

    // Factor 2: Critical drain percentage (30% weight)
    const criticalPercentage = (stats.criticalDrainCount / stats.totalDrains) * 100;
    risk += criticalPercentage * 0.3;

    // Factor 3: Time to fill urgency (20% weight)
    if (stats.avgTimeToFill !== null && stats.avgTimeToFill > 0) {
      const urgency = Math.max(0, 100 - stats.avgTimeToFill * 2);
      risk += urgency * 0.2;
    }

    return Math.min(100, Math.max(0, risk));
  }

  /**
   * Get zone with full statistics and drain details
   */
  async getZoneWithDetails(zoneId: string) {
    const zone = await this.getZoneById(zoneId);
    const drains = await Drain.find({ zoneId });

    return {
      zone,
      drains,
      summary: {
        totalDrains: drains.length,
        safeDrains: drains.filter(d => d.status === 'safe').length,
        watchDrains: drains.filter(d => d.status === 'watch').length,
        warningDrains: drains.filter(d => d.status === 'warning').length,
        criticalDrains: drains.filter(d => d.status === 'critical').length,
        offlineDrains: drains.filter(d => d.status === 'offline').length
      }
    };
  }

  /**
   * Get all high-risk zones
   */
  async getHighRiskZones(threshold: number = 70) {
    return await Zone.find({ riskScore: { $gte: threshold } })
      .sort({ riskScore: -1 })
      .lean();
  }
}

export default new ZoneService();
