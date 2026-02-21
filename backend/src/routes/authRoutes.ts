import express from 'express';
import { signup, login, registerBouncer, googleAuth, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/bouncer/register', registerBouncer);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);

export default router;
