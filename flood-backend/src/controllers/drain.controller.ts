// controllers/drain.controller.ts (COMPLETE)
import { Request, Response } from 'express';
import drainService from '../services/drain.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { parseIntParam, parseFloatParam, toStringParam } from '../utils/paramParser';

class DrainController {
  // Get all drains with optional filters
  getAllDrains = asyncHandler(async (req: Request, res: Response) => {
    const basinId = toStringParam(req.query.basinId) || undefined;
    const status = toStringParam(req.query.status) || undefined;
    const zoneId = toStringParam(req.query.zoneId) || undefined;

    const drains = await drainService.getAllDrains({ basinId, status, zoneId });

    res.json({
      success: true,
      count: drains.length,
      data: drains
    });
  });

  // Get single drain by drainId (number)
  getDrainById = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseIntParam(req.params.id);

    if (drainId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const drain = await drainService.getDrainById(drainId);
    
    res.json({
      success: true,
      data: drain
    });
  });

  // Get nearby drains (geospatial)
  getNearbyDrains = asyncHandler(async (req: Request, res: Response) => {
    const lng = parseFloatParam(req.params.lng);
    const lat = parseFloatParam(req.params.lat);
    const radius = parseIntParam(req.query.radius) || 5000;

    if (lng === null || lat === null) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const drains = await drainService.getNearbyDrains(lng, lat, radius);

    res.json({
      success: true,
      count: drains.length,
      radius: `${radius}m`,
      data: drains
    });
  });

  // Create new drain (admin only)
  createDrain = asyncHandler(async (req: Request, res: Response) => {
    const drain = await drainService.createDrain(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Drain created successfully',
      data: drain
    });
  });

  // Update drain (admin only)
  updateDrain = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseInt(String(req.params.id), 10);

    if (isNaN(drainId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const drain = await drainService.updateDrain(drainId, req.body);
    
    res.json({
      success: true,
      message: 'Drain updated successfully',
      data: drain
    });
  });

  // Get drains by zone
  getDrainsByZone = asyncHandler(async (req: Request, res: Response) => {
    const zoneId = toStringParam(req.params.zoneId);
    const drains = await drainService.getDrainsByZone(zoneId);
    
    res.json({
      success: true,
      count: drains.length,
      data: drains
    });
  });

  // Get drains by basin
  getDrainsByBasin = asyncHandler(async (req: Request, res: Response) => {
    const basinId = toStringParam(req.params.basinId);
    const drains = await drainService.getDrainsByBasin(basinId);
    
    res.json({
      success: true,
      count: drains.length,
      data: drains
    });
  });

  // Get critical drains (for emergency dashboard)
  getCriticalDrains = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const drains = await drainService.getCriticalDrains(limit);
    
    res.json({
      success: true,
      count: drains.length,
      data: drains
    });
  });

  // Manual sensor data update (for testing/demo)
  updateSensorData = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseInt(String(req.params.drainId), 10);

    if (isNaN(drainId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const sensorData = req.body;
    
    const updatedDrain = await drainService.updateDrainFromSensorData(
      drainId,
      sensorData
    );
    
    res.json({
      success: true,
      message: 'Drain updated from sensor data',
      data: updatedDrain
    });
  });

  // Get drain metrics (DCI, degradation, etc.)
  getDrainMetrics = asyncHandler(async (req: Request, res: Response) => {
    const drainId = parseIntParam(req.params.id);

    if (drainId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drain ID'
      });
    }
    
    const drain = await drainService.getDrainById(drainId);
    
    res.json({
      success: true,
      data: {
        drainId: drain.drainId,
        currentMetrics: drain.currentMetrics,
        currentWaterLevel: drain.currentWaterLevel,
        effectiveCapacity: drain.effectiveCapacity,
        stressIndex: drain.stressIndex,
        timeToFill: drain.timeToFill,
        status: drain.status,
        lastUpdate: drain.lastSensorUpdate
      }
    });
  });

  // Get drain by code (alternate identifier)
  getDrainByCode = asyncHandler(async (req: Request, res: Response) => {
    const code = toStringParam(req.params.code);
    if (!code) {
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    const drain = await drainService.getDrainByCode(code);
    res.json({ success: true, data: drain });
  });
}

export default new DrainController();
