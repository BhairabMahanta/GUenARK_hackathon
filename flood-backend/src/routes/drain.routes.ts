import { Router } from 'express';
import drainController from '../controllers/drain.controller';
import { authenticateToken, requireGMC } from '../middleware/auth.middleware';

const router = Router();

// Public routes (read-only)
router.get('/', drainController.getAllDrains);
router.get('/critical', drainController.getCriticalDrains);
router.get('/nearby/:lng/:lat', drainController.getNearbyDrains);
router.get('/zone/:zoneId', drainController.getDrainsByZone);
router.get('/basin/:basinId', drainController.getDrainsByBasin);
router.get('/code/:code', drainController.getDrainByCode);
router.get('/:id', drainController.getDrainById);

// Protected routes (GMC/Admin only)
router.post('/', authenticateToken, requireGMC, drainController.createDrain);
router.patch('/:id', authenticateToken, requireGMC, drainController.updateDrain);

// Sensor data update (can be protected or public for demo)
router.post('/:drainId/sensor', drainController.updateSensorData);

export default router;
