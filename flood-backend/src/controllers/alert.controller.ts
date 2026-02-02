import { Request, Response } from 'express';
import alertService from '../services/alert.service';
import { asyncHandler } from '../middleware/asyncHandler';

class AlertController {
  getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const { severity, type, acknowledged } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const alerts = await alertService.getAlerts(
      { severity, type, acknowledged },
      limit
    );
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  });

  acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
    const alert = await alertService.acknowledgeAlert(req.params.id as string);
    
    res.json({
      success: true,
      data: alert
    });
  });

  getUnacknowledgedCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await alertService.getUnacknowledgedCount();
    
    res.json({
      success: true,
      data: { count }
    });
  });
}

export default new AlertController();
