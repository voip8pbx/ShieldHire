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
exports.getTrainerById = exports.getTrainers = void 0;
const db_1 = __importDefault(require("../config/db"));
const getTrainers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { specialization, search } = req.query;
        const where = {};
        if (specialization) {
            where.specialization = {
                contains: specialization,
                // mode: 'insensitive', // SQLite might not support insensitive directly without setup, but Prisma maps it.
            };
        }
        if (search) {
            where.user = {
                name: {
                    contains: search,
                },
            };
        }
        const trainers = yield db_1.default.trainerProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.json(trainers);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getTrainers = getTrainers;
const getTrainerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const trainer = yield db_1.default.trainerProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                // Limit bookings to recent 10 for performance
                bookings: {
                    take: 10,
                    orderBy: { date: 'desc' },
                    include: {
                        review: {
                            select: {
                                rating: true,
                                comment: true,
                                createdAt: true,
                            }
                        }
                    }
                }
            },
        });
        if (!trainer) {
            return res.status(404).json({ error: 'Trainer not found' });
        }
        res.json(trainer);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getTrainerById = getTrainerById;
