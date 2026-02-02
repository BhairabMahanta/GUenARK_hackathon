import { Request, Response } from 'express';
import reportService from '../services/report.service';
import socketService from '../services/socket.service';
import { asyncHandler } from '../middleware/asyncHandler';

class ReportController {
  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const { status, userId, drainId } = req.query;
    const reports = await reportService.getAllReports({ status, userId, drainId });
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getReportById(req.params.id as string);
    
    res.json({
      success: true,
      data: report
    });
  });

  createReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.createReport(req.body);
    
    // Emit new report to zone if drain is associated
    if (report.drainId) {
      const drain: any = report.drainId;
      if (drain.zoneId) {
        socketService.emitNewReport(drain.zoneId.toString(), report);
      }
    }
    
    res.status(201).json({
      success: true,
      data: report
    });
  });

  updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, verifiedBy } = req.body;
    const report = await reportService.updateReportStatus(
      req.params.id as string,
      status,
      verifiedBy
    );
    
    res.json({
      success: true,
      data: report
    });
  });

  getReportsByDrain = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const reports = await reportService.getReportsByDrain(req.params.drainId as string, limit);
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  });
}

export default new ReportController();
