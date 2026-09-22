import express from 'express';
import { updateProfile, getProfile, getUsers, getNotifications, markNotificationRead } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, authorize(['ADMIN']), getUsers);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

export default router;
