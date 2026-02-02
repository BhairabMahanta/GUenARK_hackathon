import Report, { IReport } from '../models/Report';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

class ReportService {
  async getAllReports(filters: any = {}) {
    const query: any = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.userId = filters.userId;
    if (filters.drainId) query.drainId = filters.drainId;
    
    return await Report.find(query)
      .populate('userId drainId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getReportById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid report ID', 400);
    }
    
    const report = await Report.findById(id)
      .populate('userId drainId verifiedBy')
      .lean();
    
    if (!report) throw new AppError('Report not found', 404);
    return report;
  }

  async createReport(data: Partial<IReport>) {
    const report = await Report.create(data);
    return await report.populate('userId drainId');
  }

  async updateReportStatus(id: string, status: string, verifiedBy?: string) {
    const report = await Report.findByIdAndUpdate(
      id,
      { 
        status, 
        verifiedBy: verifiedBy || undefined,
        verifiedAt: status === 'verified' ? new Date() : undefined
      },
      { new: true }
    ).populate('userId drainId');
    
    if (!report) throw new AppError('Report not found', 404);
    return report;
  }

  async getReportsByDrain(drainId: string, limit: number = 20) {
    return await Report.find({ drainId })
      .populate('userId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

export default new ReportService();
