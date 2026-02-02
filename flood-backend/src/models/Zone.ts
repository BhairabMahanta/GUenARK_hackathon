import mongoose, { Schema, Document } from 'mongoose';

export interface IZoneStats {
  avgStress: number; // Average stress index of all drains
  avgTimeToFill: number | null; // Average time to fill (minutes) - can be null
  criticalDrainCount: number; // Number of drains in critical state
  totalDrains: number;
  lastCalculated: Date;
}

export interface IZone extends Document {
  zoneCode: string; // Human-readable: "Bharalu-Z3"
  name: string;
  boundary: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON polygon
  };
  basin: string;
  
  // Aggregated Zone Statistics
  zoneStats: IZoneStats;
  riskScore: number; // 0-100 composite zone risk
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const ZoneStatsSchema = new Schema({
  avgStress: { type: Number, default: 0, min: 0, max: 100 },
  avgTimeToFill: { type: Number, default: null }, // ✅ Allows null
  criticalDrainCount: { type: Number, default: 0, min: 0 },
  totalDrains: { type: Number, default: 0, min: 0 },
  lastCalculated: { type: Date, default: Date.now }
}, { _id: false });

const ZoneSchema = new Schema<IZone>({
  zoneCode: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { type: String, required: true, unique: true },
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true }
  },
  basin: { type: String, required: true, index: true },
  
  // Aggregated Statistics
  zoneStats: { type: ZoneStatsSchema, default: () => ({}) },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

export default mongoose.model<IZone>('Zone', ZoneSchema);
