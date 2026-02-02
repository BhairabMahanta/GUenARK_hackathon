// services/drain.service.ts (COMPLETE REPLACEMENT)
import { Drain } from '../models/Drain';
import { SensorReading } from '../models/SensorReading';
import { DciTimeseries } from '../models/DciTimeseries';
import { DrainHealthTimeseries } from '../models/DrainHealthTimeseries';
import { NotFoundError } from '../utils/errors';

interface DrainFilters {
  basinId?: string;
  status?: string;
  zoneId?: string;
}

class DrainService {
  /**
   * ✅ CORE: Enrich drain with latest timeseries data
   */
  private async enrichDrainWithTimeseries(drainDoc: any) {
    const drain = drainDoc.toObject ? drainDoc.toObject() : drainDoc;
    const drainId = drain.drainId;

    try {
      // Get latest sensor reading
      const latestSensor = await SensorReading.findOne({ drainId })
        .sort({ timestamp: -1 })
        .lean();

      // Get latest DCI data
      const latestDci = await DciTimeseries.findOne({ drainId })
        .sort({ timestamp: -1 })
        .lean();

      // Get latest health data
      const latestHealth = await DrainHealthTimeseries.findOne({ drainId })
        .sort({ timestamp: -1 })
        .lean();

      // Update with latest sensor data
      if (latestSensor) {
        drain.currentWaterLevel = latestSensor.waterLevelPercent;
        drain.inflowRate = latestSensor.flowRateLps;
        drain.lastSensorUpdate = latestSensor.timestamp;
      }

      // Update with latest DCI metrics
      if (latestDci) {
        drain.currentMetrics.lEff = latestDci.lEff;
        drain.currentMetrics.bEff = latestDci.bEff;
        drain.currentMetrics.fEff = latestDci.fEff;
        drain.currentMetrics.dci = latestDci.dci;
      }

      // Update with latest health metrics
      if (latestHealth) {
        drain.currentMetrics.dci = latestHealth.dci;
        drain.currentMetrics.dciEff = latestHealth.dciEff;
        drain.currentMetrics.degradationRateHr = latestHealth.degradationRateHr;
      }

      // Recalculate derived values
      const netFlowRate = drain.inflowRate - drain.outflowRate;
      
      // Calculate time to fill (in minutes)
      if (netFlowRate > 0 && drain.currentWaterLevel < 100) {
        const remainingCapacity = drain.effectiveCapacity * (1 - drain.currentWaterLevel / 100);
        drain.timeToFill = (remainingCapacity / netFlowRate) / 60;
      } else {
        drain.timeToFill = null;
      }

      // Calculate stress index
      drain.stressIndex = Math.min(100, (
        drain.currentWaterLevel * 0.4 +
        (drain.blockageFactor * 100) * 0.3 +
        (1 - (drain.currentMetrics.dciEff || 0)) * 100 * 0.3
      ));

      // Determine status
      if (!latestSensor && !latestDci) {
        drain.status = 'offline';
      } else if (drain.currentWaterLevel >= 90 || drain.stressIndex >= 80) {
        drain.status = 'critical';
      } else if (drain.currentWaterLevel >= 70 || drain.stressIndex >= 60) {
        drain.status = 'warning';
      } else if (drain.currentWaterLevel >= 50 || drain.stressIndex >= 40) {
        drain.status = 'watch';
      } else {
        drain.status = 'safe';
      }

      // Calculate time to failure
      if (drain.currentMetrics.degradationRateHr && drain.currentMetrics.degradationRateHr > 0) {
        drain.currentMetrics.timeToFailureHr = 
          (drain.currentMetrics.dciEff * 100) / drain.currentMetrics.degradationRateHr;
      } else {
        drain.currentMetrics.timeToFailureHr = null;
      }

      // Set risk level
      if (drain.status === 'critical') {
        drain.currentMetrics.riskLevel = 'CRITICAL';
      } else if (drain.status === 'warning' || drain.status === 'watch') {
        drain.currentMetrics.riskLevel = 'WARNING';
      } else {
        drain.currentMetrics.riskLevel = 'NORMAL';
      }

      return drain;
    } catch (error) {
      console.error(`Error enriching drain ${drainId}:`, error);
      return drain;
    }
  }

  /**
   * Get all drains with optional filters
   */
  async getAllDrains(filters: DrainFilters = {}) {
    const query: any = {};
    
    if (filters.basinId) query.basinId = filters.basinId;
    if (filters.status) query.status = filters.status;
    if (filters.zoneId) query.zoneId = filters.zoneId;

    const drains = await Drain.find(query).lean();
    
    // Enrich all drains with timeseries data
    return Promise.all(
      drains.map(drain => this.enrichDrainWithTimeseries(drain))
    );
  }

  /**
   * Get single drain by ID
   */
  async getDrainById(drainId: number) {
    const drain = await Drain.findOne({ drainId });
    
    if (!drain) {
      throw new NotFoundError(`Drain ${drainId} not found`);
    }

    return this.enrichDrainWithTimeseries(drain);
  }

  /**
   * Get drains by basin
   */
  async getDrainsByBasin(basinId: string) {
    const drains = await Drain.find({ basinId }).lean();
    return Promise.all(drains.map(d => this.enrichDrainWithTimeseries(d)));
  }

  /**
   * Get drains by zone
   */
  async getDrainsByZone(zoneId: string) {
    const drains = await Drain.find({ zoneId }).lean();
    return Promise.all(drains.map(d => this.enrichDrainWithTimeseries(d)));
  }

  /**
   * Get critical drains
   */
  async getCriticalDrains(limit: number = 20) {
    const drains = await Drain.find({
      status: { $in: ['critical', 'warning'] }
    })
      .sort({ stressIndex: -1 })
      .limit(limit)
      .lean();
    
    return Promise.all(drains.map(d => this.enrichDrainWithTimeseries(d)));
  }

  /**
   * Get nearby drains
   */
  async getNearbyDrains(lng: number, lat: number, radiusMeters: number = 5000) {
    const drains = await Drain.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusMeters
        }
      }
    }).lean();

    return Promise.all(drains.map(d => this.enrichDrainWithTimeseries(d)));
  }

  /**
   * Create drain
   */
  async createDrain(drainData: any) {
    return Drain.create(drainData);
  }

  /**
   * Update drain
   */
  async updateDrain(drainId: number, updateData: any) {
    const drain = await Drain.findOneAndUpdate(
      { drainId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!drain) {
      throw new NotFoundError(`Drain ${drainId} not found`);
    }

    return this.enrichDrainWithTimeseries(drain);
  }

  /**
   * Update drain from sensor data
   */
  async updateDrainFromSensorData(
    drainId: number,
    sensorData: {
      waterLevel: number;
      turbidity?: number;
      flowRate?: number;
      rainfall?: number;
    }
  ) {
    // Create new sensor reading
    await SensorReading.create({
      drainId,
      timestamp: new Date(),
      waterLevelPercent: sensorData.waterLevel,
      turbidityNtu: sensorData.turbidity || 0,
      flowRateLps: sensorData.flowRate || 0,
      rainfallMmPerHour: sensorData.rainfall || 0
    });

    // Return enriched drain
    return this.getDrainById(drainId);
  }

  /**
   * Get drain by code
   */
  async getDrainByCode(code: string) {
    const drain = await Drain.findOne({ code });
    if (!drain) {
      throw new NotFoundError(`Drain with code ${code} not found`);
    }
    return this.enrichDrainWithTimeseries(drain);
  }
}

export default new DrainService();
