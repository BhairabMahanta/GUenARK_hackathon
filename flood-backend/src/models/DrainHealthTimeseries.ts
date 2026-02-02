// models/DrainHealthTimeseries.ts - Historical health snapshots
import mongoose, { Document } from 'mongoose';

export interface IDrainHealthTimeseries extends Document {
  timestamp: Date;
  drainId: number;
  dci: number;
  dciEff: number;
  degradationRateHr: number | null;
}

const schema = new mongoose.Schema<IDrainHealthTimeseries>({
  timestamp: { type: Date, required: true },
  drainId: { type: Number, required: true },
  dci: Number,
  dciEff: Number,
  degradationRateHr: { type: Number, default: null }
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'drainId',
    granularity: 'hours'
  },
//   expireAfterSeconds: 86400
});

export const DrainHealthTimeseries = mongoose.model<IDrainHealthTimeseries>('DrainHealthTimeseries', schema);
