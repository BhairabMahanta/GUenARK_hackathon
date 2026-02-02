// types/drain.types.ts
export interface Drain {
  _id: string;
  drainId: number;
  name?: string;
  basinId: string;
  zoneId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  dimensions: {
    depthCm: number;
    widthCm: number;
    drainType: string;
  };
  vulnerabilityFactor: number;
  capacity?: number;
  currentMetrics: {
    dci: number;
    dciEff: number;
    degradationRateHr: number | null;
    timeToFailureHr: number | null;
    riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
    lEff: number;
    bEff: number;
    fEff: number;
  };
  currentWaterLevel: number;
  effectiveCapacity: number;
  stressIndex: number;
  timeToFill: number | null;
  blockageFactor: number;
  inflowRate: number;
  outflowRate: number;
  status: 'safe' | 'watch' | 'warning' | 'critical' | 'offline';
  lastSensorUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrainFilters {
  basinId?: string;
  status?: 'safe' | 'watch' | 'warning' | 'critical' | 'offline';
  zoneId?: string;
  search?: string;
}

export interface DrainMetrics {
  drainId: number;
  currentMetrics: Drain['currentMetrics'];
  currentWaterLevel: number;
  effectiveCapacity: number;
  stressIndex: number;
  timeToFill: number | null;
  status: string;
  lastUpdate?: Date;
}
