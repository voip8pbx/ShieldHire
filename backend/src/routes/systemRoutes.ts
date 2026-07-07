import express from 'express';
import { keepAlive } from '../controllers/keepAliveController';
import { keepAliveAuth } from '../middleware/keepAliveAuth';

const router = express.Router();

// GET /api/system/keep-alive
// Protected: requires Authorization: Bearer <KEEP_ALIVE_SECRET>
router.get('/keep-alive', keepAliveAuth, keepAlive);

export default router;
