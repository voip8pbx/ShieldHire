import express from 'express';
import { 
    createBooking, 
    getUserBookings, 
    getPendingBookings, 
    updateBookingStatus, 
    getBouncerHistoryBookings, 
    getBookingDetail, 
    updateBookingPayment,
    postChatMessage,
    submitPaymentDetails,
    rateBooking
} from '../controllers/bookingController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/', getUserBookings);
router.get('/pending', getPendingBookings);
router.get('/bouncer/history', getBouncerHistoryBookings);
router.get('/:id', getBookingDetail);
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/payment', updateBookingPayment);
router.post('/:id/chat', postChatMessage);
router.patch('/:id/payment-details', submitPaymentDetails);
router.post('/:id/rate', rateBooking);

export default router;

