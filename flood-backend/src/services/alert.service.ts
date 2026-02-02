import Alert, { IAlert } from '../models/Alert';
import mongoose from 'mongoose';

class AlertService {
  async createAlert(data: Partial<IAlert>) {
    return await Alert.create(data);
  }

  async getAlerts(filters: any = {}, limit: number = 50) {
    const query: any = {};
    
    if (filters.severity) query.severity = filters.severity;
    if (filters.type) query.type = filters.type;
    if (filters.acknowledged !== undefined) {
      query.acknowledged = filters.acknowledged === 'true';
    }
    
    return await Alert.find(query)
      .populate('drainId zoneId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async acknowledgeAlert(id: string) {
    return await Alert.findByIdAndUpdate(
      id,
      { acknowledged: true },
      { new: true }
    );
  }

  async getUnacknowledgedCount() {
    return await Alert.countDocuments({ acknowledged: false });
  }
}

export default new AlertService();
