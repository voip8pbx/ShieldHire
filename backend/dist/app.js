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
app.use(express_1.default.json({ limit: '10mb' })); // Limit payload size
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const trainerRoutes_1 = __importDefault(require("./routes/trainerRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
app.use('/auth', authRoutes_1.default);
app.use('/user', userRoutes_1.default);
app.use('/trainers', trainerRoutes_1.default);
app.use('/bookings', bookingRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Home Gym Trainer API is running' });
});
exports.default = app;
