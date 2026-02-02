import { Router } from 'express';
import reportController from '../controllers/report.controller';

const router = Router();

router.get('/', reportController.getAllReports);
router.get('/drain/:drainId', reportController.getReportsByDrain);
router.get('/:id', reportController.getReportById);
router.post('/', reportController.createReport);
router.patch('/:id/status', reportController.updateReportStatus);

export default router;
