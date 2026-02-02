// types/sensor.types.ts
export interface SensorReading {
  _id: string;
  drainId: number;
  timestamp: Date;
  waterLevelPercent: number;
  rainfallMmPerHour: number;
  flowRateLps: number;
  turbidityNtu: number;
  metadata?: Record<string, any>;
}

export interface ReadingStats {
  avgWaterLevel: number;
  maxWaterLevel: number;
  minWaterLevel: number;
  avgTurbidity: number;
  avgFlowRate: number;
  totalReadings: number;
}

export interface LatestReading {
  _id: number; // drainId
  latestReading: SensorReading;
}

export interface BasinAggregate {
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
