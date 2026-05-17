import express from 'express';
import { createBooking, getUserBookings, getPendingBookings, updateBookingStatus, getBouncerHistoryBookings, getBookingDetail } from '../controllers/bookingController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/', getUserBookings);
router.get('/pending', getPendingBookings);
router.get('/bouncer/history', getBouncerHistoryBookings);
router.get('/:id', getBookingDetail);
router.patch('/:id/status', updateBookingStatus);

export default router;
