// models/Drain.ts (UPDATED - FULL FILE)
import mongoose, { Document } from 'mongoose';

export interface IDimensions {
  depthCm: number;
  widthCm: number;
  drainType: 'rectangular' | 'circular' | 'trapezoidal' | 'small_residential';
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ICurrentMetrics {
  dci: number;
  dciEff: number;
  degradationRateHr: number | null;
  timeToFailureHr: number | null;
  riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'WATCH';
  lEff: number;
  bEff: number;
  fEff: number;
}

export interface IDrain extends Document {
  drainId: number;
  name?: string;
  
  // Location
  basinId: string;
  zoneId: string;
  location: ILocation;
  
  // Static properties
  dimensions: IDimensions;
  vulnerabilityFactor: number;
  capacity?: number;
  
  // Current state
  currentMetrics: ICurrentMetrics;
  currentWaterLevel: number;
  effectiveCapacity: number;
  stressIndex: number;
  
  // Hydrology (for service calculations)
  blockageFactor: number;
  inflowRate: number;
  outflowRate: number;
  timeToFill: number | null;
  
  // Status
  status: 'safe' | 'watch' | 'warning' | 'critical' | 'offline';
  lastSensorUpdate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const DrainSchema = new mongoose.Schema<IDrain>({
  drainId: { type: Number, required: true, unique: true },
  name: String,
  
  basinId: { type: String, required: true },
  zoneId: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  
  dimensions: {
    depthCm: { type: Number, required: true },
    widthCm: { type: Number, required: true },
    drainType: { type: String, required: true }
  },
  
  vulnerabilityFactor: { type: Number, default: 1.0 },
  capacity: Number,
  
  currentMetrics: {
    dci: { type: Number, default: 0 },
    dciEff: { type: Number, default: 0 },
    degradationRateHr: { type: Number, default: null },
    timeToFailureHr: { type: Number, default: null },
    riskLevel: { 
      type: String, 
      enum: ['NORMAL', 'WARNING', 'CRITICAL', 'WATCH', 'OFFLINE'],  // ✅ FIXED
      default: 'NORMAL' 
    },
    lEff: { type: Number, default: 0 },
    bEff: { type: Number, default: 0 },
    fEff: { type: Number, default: 0 }
  },
  
  currentWaterLevel: { type: Number, default: 0 },
  effectiveCapacity: { type: Number, default: 0 },
  stressIndex: { type: Number, default: 0 },
  
  // Hydrology fields
  blockageFactor: { type: Number, default: 0 },
  inflowRate: { type: Number, default: 0 },
  outflowRate: { type: Number, default: 0 },
  timeToFill: { type: Number, default: null },
  
  status: { 
    type: String, 
    enum: ['safe', 'watch', 'warning', 'critical', 'offline'],
    default: 'offline'
  },
  lastSensorUpdate: Date
}, {
  timestamps: true
});

// GeoJSON index
DrainSchema.index({ location: '2dsphere' });

// Auto-calculate capacity
DrainSchema.pre('save', function(this: IDrain) {
  if (this.isModified('dimensions')) {
    const { depthCm, widthCm, drainType } = this.dimensions;
    const lengthCm = 100;
    
    if (drainType === 'rectangular' || drainType === 'small_residential') {
      this.capacity = (depthCm * widthCm * lengthCm) / 1000;
    } else if (drainType === 'circular') {
      const radiusCm = widthCm / 2;
      this.capacity = (Math.PI * radiusCm * radiusCm * lengthCm) / 1000;
    } else if (drainType === 'trapezoidal') {
      const avgWidth = widthCm * 0.8;
      this.capacity = (depthCm * avgWidth * lengthCm) / 1000;
    }
    
    if (!this.effectiveCapacity) {
      this.effectiveCapacity = this.capacity || 0;
    }
  }
});

export const Drain = mongoose.model<IDrain>('Drain', DrainSchema);
export default Drain;
