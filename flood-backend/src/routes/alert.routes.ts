import { Router } from 'express';
import alertController from '../controllers/alert.controller';

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/unacknowledged/count', alertController.getUnacknowledgedCount);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);

export default router;
