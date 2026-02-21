import express from 'express';
import { createAlert, getAlerts, acknowledgeAlert } from '../controllers/alertController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();


router.post('/', authenticate, createAlert);
router.get('/', getAlerts);
router.put('/:id/acknowledge', acknowledgeAlert);

export default router;
