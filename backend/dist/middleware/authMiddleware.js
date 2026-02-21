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
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const supabase_1 = require("../config/supabase");
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        // ── 1. Try Firebase ID Token first ──────────────────────────────────
        try {
            const decoded = yield firebase_1.firebaseAuth.verifyIdToken(token);
            const firebaseUid = decoded.uid;
            const email = decoded.email;
            if (!email) {
                return res.status(401).json({ error: 'Firebase token missing email.' });
            }
            // Look up the real user in Supabase DB also fetching bouncer profile
            let { data: dbUser } = yield supabase_1.supabaseAdmin
                .from('users')
                .select('*, bouncers(*)')
                .eq('email', email)
                .single();
            if (!dbUser) {
                // Auto-create the user on first Firebase login
                const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .insert({
                    email,
                    name: decoded.name || email.split('@')[0],
                    role: 'USER',
                    googleId: firebaseUid,
                    password: '',
                })
                    .select()
                    .single();
                if (createError || !newUser) {
                    console.error('Failed to auto-create user:', createError);
                    return res.status(500).json({ error: 'Failed to create user profile.' });
                }
                dbUser = Object.assign(Object.assign({}, newUser), { bouncers: [] });
            }
            else if (!dbUser.googleId) {
                // Update googleId if missing
                yield supabase_1.supabaseAdmin
                    .from('users')
                    .update({ googleId: firebaseUid })
                    .eq('id', dbUser.id);
            }
            // Correct role: bouncer profile exists but role is still USER → fix it
            const hasBouncer = dbUser.bouncers && dbUser.bouncers.length > 0;
            if (hasBouncer && dbUser.role === 'USER') {
                dbUser.role = 'BOUNCER';
            }
            req.user = Object.assign(Object.assign({}, dbUser), { firebaseUid });
            return next();
        }
        catch (_firebaseErr) {
            // Not a Firebase token — fall through to Supabase
        }
        // ── 2. Fallback: Try Supabase Auth token ────────────────────────────
        try {
            const { data: { user }, error } = yield supabase_1.supabaseAdmin.auth.getUser(token);
            if (user && !error) {
                let { data: dbUser } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('authId', user.id)
                    .single();
                if (!dbUser && user.email) {
                    const { data: dbUserByEmail } = yield supabase_1.supabaseAdmin
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single();
                    dbUser = dbUserByEmail;
                    if (dbUser && !dbUser.authId) {
                        yield supabase_1.supabaseAdmin.from('users').update({ authId: user.id }).eq('id', dbUser.id);
                    }
                }
                if (dbUser) {
                    req.user = dbUser;
                }
                else {
                    req.user = { id: user.id, email: user.email, role: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.role) || 'USER' };
                }
                return next();
            }
        }
        catch (_supabaseErr) {
            // Not a Supabase token — fall through to legacy JWT
        }
        // ── 3. Last resort: Legacy custom JWT ──────────────────────────────
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
});
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
exports.authorize = authorize;
