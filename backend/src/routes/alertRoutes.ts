import express from 'express';
import { createAlert, getAlerts, acknowledgeAlert } from '../controllers/alertController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();


router.post('/', authenticate, createAlert);
router.get('/', authenticate, authorize(['ADMIN']), getAlerts);
router.put('/:id/acknowledge', authenticate, authorize(['ADMIN']), acknowledgeAlert);

export default router;
