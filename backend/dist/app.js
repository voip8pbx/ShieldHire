"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const app = (0, express_1.default)();
// Middleware
app.use((0, compression_1.default)()); // Enable gzip compression
app.use(express_1.default.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const bouncerRoutes_1 = __importDefault(require("./routes/bouncerRoutes"));
const verificationRoutes_1 = __importDefault(require("./routes/verificationRoutes"));
const bouncerStatusRoutes_1 = __importDefault(require("./routes/bouncerStatusRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
app.use('/auth', authRoutes_1.default);
app.use('/user', userRoutes_1.default);
app.use('/bookings', bookingRoutes_1.default);
app.use('/api/bouncers', bouncerRoutes_1.default);
app.use('/api/verifications', verificationRoutes_1.default);
app.use('/api/bouncer-status', bouncerStatusRoutes_1.default);
app.use('/api/alerts', alertRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Home Gym Trainer API is running' });
});
exports.default = app;
