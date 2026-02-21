import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

const app = express();

// Middleware
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import bookingRoutes from './routes/bookingRoutes';
import bouncerRoutes from './routes/bouncerRoutes';
import verificationRoutes from './routes/verificationRoutes';
import bouncerStatusRoutes from './routes/bouncerStatusRoutes';
import alertRoutes from './routes/alertRoutes';

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/bookings', bookingRoutes);
app.use('/api/bouncers', bouncerRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/bouncer-status', bouncerStatusRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Home Gym Trainer API is running' });
});

export default app;
