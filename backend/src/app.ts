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

app.use(['/auth', '/api/auth'], authRoutes);
app.use(['/user', '/api/user'], userRoutes);
app.use(['/bookings', '/api/bookings'], bookingRoutes);
app.use(['/bouncers', '/api/bouncers'], bouncerRoutes);
app.use(['/verifications', '/api/verifications'], verificationRoutes);
app.use(['/bouncer-status', '/api/bouncer-status'], bouncerStatusRoutes);
app.use(['/alerts', '/api/alerts'], alertRoutes);

app.get('/api', (req, res) => {
    res.json({ message: 'Home Gym Trainer API is running (via /api)' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Home Gym Trainer API is running' });
});

export default app;
