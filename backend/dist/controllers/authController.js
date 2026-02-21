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
exports.googleAuth = exports.registerBouncer = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = req.body;
        // Check if user exists
        const existingUser = yield db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password (reduced rounds for better performance)
        const hashedPassword = yield bcryptjs_1.default.hash(password, 8);
        // Create user
        const user = yield db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'USER', // Default to USER
            },
        });
        // Create TrainerProfile if role is TRAINER
        if (user.role === 'TRAINER') {
            const { specialization, pricePerSession } = req.body;
            yield db_1.default.trainerProfile.create({
                data: {
                    userId: user.id,
                    specialization: specialization || 'General Fitness',
                    pricePerSession: pricePerSession ? parseFloat(pricePerSession) : 50.0,
                }
            });
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
// ... (existing exports)
const registerBouncer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, contactNo, age, gender, profilePhoto, govtIdPhoto, hasGunLicense, gunLicensePhoto, isGunman, registrationType, agencyReferralCode, role } = req.body;
        // Check if user exists
        let user = yield db_1.default.user.findUnique({ where: { email } });
        let isNewUser = false;
        if (!user) {
            // Create new user
            isNewUser = true;
            // If password is not provided (e.g. Google Auth flow but registering directly?), generate a random one
            const passwordToHash = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(passwordToHash, 8);
            user = yield db_1.default.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: role || 'BOUNCER',
                },
            });
        }
        else {
            // Update existing user role if needed, or keeping it as is?
            // Usually we might want to update the name or role if they are upgrading
            // For now, let's update the name if provided
            yield db_1.default.user.update({
                where: { id: user.id },
                data: {
                    name: name || user.name,
                    role: role || user.role // Update role to BOUNCER/GUNMAN if passed
                }
            });
        }
        // Check if bouncer profile already exists
        const existingBouncer = yield db_1.default.bouncer.findUnique({
            where: { userId: user.id }
        });
        let bouncer;
        if (existingBouncer) {
            // Update existing bouncer profile
            bouncer = yield db_1.default.bouncer.update({
                where: { id: existingBouncer.id },
                data: {
                    name,
                    contactNo,
                    age,
                    gender,
                    profilePhoto,
                    govtIdPhoto,
                    hasGunLicense,
                    gunLicensePhoto,
                    isGunman,
                    registrationType,
                    agencyReferralCode,
                }
            });
        }
        else {
            // Create Bouncer Profile
            bouncer = yield db_1.default.bouncer.create({
                data: {
                    userId: user.id,
                    name,
                    contactNo,
                    age,
                    gender,
                    profilePhoto,
                    govtIdPhoto,
                    hasGunLicense,
                    gunLicensePhoto,
                    isGunman,
                    registrationType,
                    agencyReferralCode,
                },
            });
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                bouncerProfile: bouncer
            }
        });
    }
    catch (error) {
        console.error('Bouncer Registration Error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});
exports.registerBouncer = registerBouncer;
const googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, googleId } = req.body;
        let user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Create new user with random password
            // We use a random password because they are logging in via Google
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(randomPassword, 8);
            user = yield db_1.default.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || 'Google User',
                    role: 'USER',
                },
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Internal server error during Google Auth' });
    }
});
exports.googleAuth = googleAuth;
