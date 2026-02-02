// controllers/sensor.controller.ts (COMPLETE)
import { Request, Response } from 'express';
import sensorService from '../services/sensor.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { parseIntParam, toStringParam } from '../utils/paramParser';

class SensorController {
  // Get readings for a specific drain
  getDrainReadings = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseIntParam(req.params.drainId);
    const hours = parseInt(String(req.query.hours || '24'), 10) || 24;
    
    if (drainId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const readings = await sensorService.getDrainReadings(drainId, hours);
    
    res.json({
      success: true,
      count: readings.length,
      timeRange: `${hours} hours`,
      data: readings
    });
  });

  // Get basin aggregate statistics
  getBasinAggregate = asyncHandler(async (req: Request, res: Response) => {
    const basinId = toStringParam(req.params.basinId);
    const aggregate = await sensorService.getBasinAggregate(basinId);
    
    res.json({
      success: true,
      data: aggregate
    });
  });

  // Get latest readings for multiple drains
  getLatestReadings = asyncHandler(async (req: Request, res: Response) => {
    const drainIdsStr = req.query.drainIds as string;
    
    if (!drainIdsStr) {
      return res.status(400).json({
        success: false,
        message: 'drainIds query parameter required (comma-separated)'
      });
    }
    
    const drainIds = drainIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (drainIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid drain IDs provided'
      });
    }
    
    const readings = await sensorService.getLatestReadingsByDrain(drainIds);
    
    res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  });

  // Get all latest readings (for map view)
  getAllLatestReadings = asyncHandler(async (req: Request, res: Response) => {
    const readings = await sensorService.getAllLatestReadings();
    
    res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  });

  // Get reading statistics for a drain
  getReadingStats = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseIntParam(req.params.drainId);
    const hours = parseInt(String(req.query.hours || '24'), 10) || 24;
    
    if (drainId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const stats = await sensorService.getReadingStats(drainId, hours);
    
    res.json({
      success: true,
      timeRange: `${hours} hours`,
      data: stats
    });
  });

  // Save new sensor reading (for demo/testing)
  saveSensorReading = asyncHandler(async (req: Request, res: Response) => {
    const { drainId, waterLevel, rainfall, flowRate, turbidity, metadata } = req.body;
    
    if (!drainId || waterLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: 'drainId and waterLevel are required'
      });
    }
    
    const reading = await sensorService.saveSensorReading(
      parseIntParam(drainId) ?? 0,
      waterLevel,
      rainfall || 0,
      flowRate || 0,
      turbidity || 0,
      metadata
    );
    
    res.status(201).json({
      success: true,
      message: 'Sensor reading saved',
      data: reading
    });
  });
}

export default new SensorController();
