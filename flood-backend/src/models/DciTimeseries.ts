// models/DciTimeseries.ts - Historical DCI values
import mongoose, { Document } from 'mongoose';
export interface IDciTimeseries extends Document {
  timestamp: Date;
  drainId: number;
  dci: number;
  lEff: number;
  bEff: number;
  fEff: number;
}

const schema = new mongoose.Schema<IDciTimeseries>({
  timestamp: { type: Date, required: true },
  drainId: { type: Number, required: true },
  dci: Number,
  lEff: Number,
  bEff: Number,
  fEff: Number
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'drainId',
    granularity: 'minutes'
  },
//   expireAfterSeconds: 86400 // 24 hours
});

export const DciTimeseries = mongoose.model<IDciTimeseries>('DciTimeseries', schema);
