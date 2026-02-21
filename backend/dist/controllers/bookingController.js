"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserBookings = exports.createBooking = void 0;
const db_1 = __importDefault(require("../config/db"));
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { trainerId, date } = req.body;
        const booking = yield db_1.default.booking.create({
            data: {
                userId,
                trainerId,
                date: new Date(date), // Ensure date is parsed
                status: 'CONFIRMED', // Auto-confirm for demo
            },
        });
        res.status(201).json(booking);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createBooking = createBooking;
const getUserBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const bookings = yield db_1.default.booking.findMany({
            where: { userId },
            include: {
                trainer: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
            },
            orderBy: { date: 'asc' },
        });
        res.json(bookings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getUserBookings = getUserBookings;
