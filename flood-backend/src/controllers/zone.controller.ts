import { Request, Response } from 'express';
import zoneService from '../services/zone.service';
import { asyncHandler } from '../middleware/asyncHandler';

class ZoneController {
  // Get all zones
  getAllZones = asyncHandler(async (req: Request, res: Response) => {
    const zones = await zoneService.getAllZones();
    
    res.json({
      success: true,
      count: zones.length,
      data: zones
    });
  });

  // Get single zone by ID
  getZoneById = asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.getZoneById(req.params.id as string);
    
    res.json({
      success: true,
      data: zone
    });
  });

  // Get zone by human-readable code
  getZoneByCode = asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.getZoneByCode(req.params.code as string);
    
    res.json({
      success: true,
      data: zone
    });
  });

  // Get zone with full details (drains + stats)
  getZoneWithDetails = asyncHandler(async (req: Request, res: Response) => {
    const details = await zoneService.getZoneWithDetails(req.params.id as string);
    
    res.json({
      success: true,
      data: details
    });
  });

  // Create new zone (admin only)
  createZone = asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.createZone(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Zone created successfully',
      data: zone
    });
  });

  // Get high-risk zones
  getHighRiskZones = asyncHandler(async (req: Request, res: Response) => {
    const threshold = parseInt(req.query.threshold as string) || 70;
    const zones = await zoneService.getHighRiskZones(threshold);
    
    res.json({
      success: true,
      count: zones.length,
      threshold,
      data: zones
    });
  });

  // Manually trigger zone stats recalculation
  recalculateZoneStats = asyncHandler(async (req: Request, res: Response) => {
    const zone = await zoneService.updateZoneStats(req.params.id as string);
    
    res.json({
      success: true,
      message: 'Zone statistics recalculated',
      data: zone
    });
  });
}

export default new ZoneController();
