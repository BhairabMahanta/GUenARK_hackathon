// backend/src/routes/index.ts (UPDATE)
import { Router } from 'express';
import authRoutes from './auth.routes';
import drainRoutes from './drain.routes';
import zoneRoutes from './zone.routes';
import reportRoutes from './report.routes';
import sensorRoutes from './sensor.routes';
import alertRoutes from './alert.routes';
import floodRoutes from './flood.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/drains', drainRoutes);
router.use('/zones', zoneRoutes);
router.use('/reports', reportRoutes);
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/predictions', floodRoutes);  // ✅ Changed from '/floods' to '/predictions'

export default router;
