import { Router } from 'express';
import zoneController from '../controllers/zone.controller';
import { authenticateToken, requireGMC } from '../middleware/auth.middleware';

const router = Router();

// Public routes (read-only)
router.get('/', zoneController.getAllZones);
router.get('/high-risk', zoneController.getHighRiskZones);
router.get('/code/:code', zoneController.getZoneByCode);
router.get('/:id', zoneController.getZoneById);
router.get('/:id/details', zoneController.getZoneWithDetails);

// Protected routes (GMC/Admin only)
router.post('/', authenticateToken, requireGMC, zoneController.createZone);
router.post('/:id/recalculate', authenticateToken, requireGMC, zoneController.recalculateZoneStats);

export default router;
