// models/SensorReading.ts
import mongoose, { Document } from 'mongoose';

export interface ISensorReading extends Document {
  timestamp: Date;
  drainId: number;
  waterLevelPercent: number;
  rainfallMmPerHour: number;
  flowRateLps: number;
  turbidityNtu: number;
  metadata?: Record<string, any>; // For future flexibility
}

const SensorReadingSchema = new mongoose.Schema<ISensorReading>({
  timestamp: { type: Date, required: true },
  drainId: { type: Number, required: true },
  waterLevelPercent: { type: Number, required: true },
  rainfallMmPerHour: { type: Number, required: true },
  flowRateLps: { type: Number, required: true },
  turbidityNtu: { type: Number, required: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'drainId',
    granularity: 'minutes'
  },
  // expireAfterSeconds: 7200
});

export const SensorReading = mongoose.model<ISensorReading>('SensorReading', SensorReadingSchema);
