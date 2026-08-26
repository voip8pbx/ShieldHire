import express from 'express'; 
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();

// Configure CORS to whitelist trusted domains while supporting local debugging
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'https://shield-hire-znyu.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow mobile apps, curl, postman (no origin header)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.startsWith('http://localhost') || 
                          origin.startsWith('http://192.168.') || 
                          origin.startsWith('http://10.');
                          
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Apply Rate Limiter to Authentication endpoints to block brute-force attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

import path from 'path';

// Middleware
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import bookingRoutes from './routes/bookingRoutes';
import bouncerRoutes from './routes/bouncerRoutes';
import verificationRoutes from './routes/verificationRoutes';
import bouncerStatusRoutes from './routes/bouncerStatusRoutes';
import alertRoutes from './routes/alertRoutes';
import uploadRoutes from './routes/uploadRoutes';
import systemRoutes from './routes/systemRoutes';

app.use(['/auth', '/api/auth'], authLimiter, authRoutes);
app.use(['/upload', '/api/upload'], uploadRoutes);
app.use(['/user', '/api/user', '/users', '/api/users'], userRoutes);
app.use(['/bookings', '/api/bookings', '/booking', '/api/booking'], bookingRoutes);
app.use(['/bouncers', '/api/bouncers', '/bouncer', '/api/bouncer'], bouncerRoutes);
app.use(['/verifications', '/api/verifications'], verificationRoutes);
app.use(['/bouncer-status', '/api/bouncer-status'], bouncerStatusRoutes);
app.use(['/alerts', '/api/alerts'], alertRoutes);
app.use('/api/system', systemRoutes);

app.get('/api', (req, res) => {
    res.json({ message: 'ShieldHire API is running' });
});

app.get('/', (req, res) => {
    res.json({ message: 'ShieldHire API is running' });
});

export default app;
