import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  drainId: mongoose.Types.ObjectId;
  description: string;
  photoUrl?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'pending' | 'verified' | 'resolved' | 'rejected';
  severity: 'low' | 'medium' | 'high';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
}

const ReportSchema = new Schema<IReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  drainId: { type: Schema.Types.ObjectId, ref: 'Drain' },
  description: { type: String, required: true },
  photoUrl: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'resolved', 'rejected'],
    default: 'pending',
    index: true
  },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
