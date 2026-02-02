import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  type: 'sensor' | 'prediction' | 'report';
  severity: 'warning' | 'critical';
  message: string;
  drainId?: mongoose.Types.ObjectId;
  zoneId?: mongoose.Types.ObjectId;
  data: Record<string, any>;
  acknowledged: boolean;
}

const AlertSchema = new Schema<IAlert>({
  type: { type: String, enum: ['sensor', 'prediction', 'report'], required: true },
  severity: { type: String, enum: ['warning', 'critical'], required: true },
  message: { type: String, required: true },
  drainId: { type: Schema.Types.ObjectId, ref: 'Drain' },
  zoneId: { type: Schema.Types.ObjectId, ref: 'Zone' },
  data: { type: Schema.Types.Mixed, default: {} },
  acknowledged: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);
