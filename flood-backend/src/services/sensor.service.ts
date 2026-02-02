// services/sensor.service.ts (COMPLETE)
import { SensorReading } from '../models/SensorReading';
import { Drain } from '../models/Drain';

interface ReadingStats {
  avgWaterLevel: number;
  maxWaterLevel: number;
  minWaterLevel: number;
  avgTurbidity: number;
  avgFlowRate: number;
  totalReadings: number;
}

interface BasinAggregate {
  basinId: string;
  stats: {
    avgLevel: number;
    maxLevel: number;
    minLevel: number;
    totalDrains: number;
  };
  statusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  drainCount: number;
}

class SensorService {
  /**
   * Get readings for a specific drain
   */
  async getDrainReadings(drainId: number, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return SensorReading.find({
      drainId,
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Get reading statistics for a drain
   */
  async getReadingStats(drainId: number, hours: number = 24): Promise<ReadingStats> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const readings = await SensorReading.find({
      drainId,
      timestamp: { $gte: since }
    }).lean();

    if (readings.length === 0) {
      return {
        avgWaterLevel: 0,
        maxWaterLevel: 0,
        minWaterLevel: 0,
        avgTurbidity: 0,
        avgFlowRate: 0,
        totalReadings: 0
      };
    }

    return {
      avgWaterLevel: readings.reduce((sum, r) => sum + r.waterLevelPercent, 0) / readings.length,
      maxWaterLevel: Math.max(...readings.map(r => r.waterLevelPercent)),
      minWaterLevel: Math.min(...readings.map(r => r.waterLevelPercent)),
      avgTurbidity: readings.reduce((sum, r) => sum + r.turbidityNtu, 0) / readings.length,
      avgFlowRate: readings.reduce((sum, r) => sum + r.flowRateLps, 0) / readings.length,
      totalReadings: readings.length
    };
  }

  /**
   * Get all latest readings (for map view)
   */
async getAllLatestReadings() {
  const result = await SensorReading.aggregate([
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$drainId',
        latestReading: { $first: '$$ROOT' }
      }
    }
  ]);

  const latestReadings = result.map(r => r.latestReading);
  
  // Get all drains to merge metadata
  const drains = await Drain.find({}).lean();
  
  // Create lookup map
  const drainMap = new Map(drains.map(d => [d.drainId, d]));
  
  // Merge sensor readings with drain metadata
  const enrichedReadings = latestReadings.map(reading => {
    const drain = drainMap.get(reading.drainId);
    return {
      ...reading,
      basinId: drain?.basinId || 'Unknown',
      zoneId: drain?.zoneId || 'Unknown',
      currentWaterLevel: reading.waterLevelPercent
    };
  });

  return enrichedReadings;
}
  /**
   * Get latest readings for multiple drains
   */
  async getLatestReadingsByDrain(drainIds: number[]) {
    const result = await SensorReading.aggregate([
      {
        $match: { drainId: { $in: drainIds } }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$drainId',
          latestReading: { $first: '$$ROOT' }
        }
      }
    ]);

    return result;
  }

  /**
   * Get basin aggregate statistics
   */
  async getBasinAggregate(basinId: string): Promise<BasinAggregate> {
    const drains = await Drain.find({ basinId }).lean();
    const drainIds = drains.map(d => d.drainId);

    const latestReadings = await this.getLatestReadingsByDrain(drainIds);

    if (latestReadings.length === 0) {
      return {
        basinId,
        stats: {
          avgLevel: 0,
          maxLevel: 0,
          minLevel: 0,
          totalDrains: drains.length
        },
        statusBreakdown: [],
        drainCount: drains.length
      };
    }

    const levels = latestReadings.map(r => r.latestReading.waterLevelPercent);
    const statusBreakdown = drains.reduce((acc, drain) => {
      const existing = acc.find(s => s._id === drain.status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: drain.status, count: 1 });
      }
      return acc;
    }, [] as Array<{ _id: string; count: number }>);

    return {
      basinId,
      stats: {
        avgLevel: levels.reduce((sum, l) => sum + l, 0) / levels.length,
        maxLevel: Math.max(...levels),
        minLevel: Math.min(...levels),
        totalDrains: drains.length
      },
      statusBreakdown,
      drainCount: drains.length
    };
  }

  /**
   * Save new sensor reading
   */
  async saveSensorReading(
    drainId: number,
    waterLevel: number,
    rainfall: number,
    flowRate: number,
    turbidity: number,
    metadata?: any
  ) {
    return SensorReading.create({
      drainId,
      timestamp: new Date(),
      waterLevelPercent: waterLevel,
      rainfallMmPerHour: rainfall,
      flowRateLps: flowRate,
      turbidityNtu: turbidity,
      metadata
    });
  }
}

export default new SensorService();
