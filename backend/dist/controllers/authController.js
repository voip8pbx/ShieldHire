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
exports.getMe = exports.googleAuth = exports.registerBouncer = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
// Helper to format user response to match existing API structure
const formatUserResponse = (user) => {
    // Map bouncers array (Supabase 1:many) to bouncerProfile
    let bouncerProfile = null;
    if (user.bouncers && user.bouncers.length > 0) {
        bouncerProfile = camelCaseKeys(user.bouncers[0]);
    }
    else if (user.bouncerProfile) {
        bouncerProfile = user.bouncerProfile;
    }
    // Correct the role: if user has a bouncer profile, they should be BOUNCER or GUNMAN
    let role = user.role;
    if (bouncerProfile && role === 'USER') {
        role = bouncerProfile.isGunman ? 'GUNMAN' : 'BOUNCER';
    }
    const response = {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        profilePhoto: user.profilePhoto, // camelCase
        bouncerProfile,
    };
    console.log(`[AUTH] Formatted response for ${user.email}: role=${role}, hasBouncer=${!!bouncerProfile}`);
    return response;
};
// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj) => {
    if (!obj)
        return null;
    const newObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = req.body;
        // Check if user exists
        const { data: existingUser } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 8);
        // Create user
        const { data: user, error: createError } = yield supabase_1.supabaseAdmin
            .from('users')
            .insert({
            email,
            password: hashedPassword,
            name,
            role: role || 'USER',
        })
            .select()
            .single();
        if (createError || !user) {
            console.error('Signup Error:', createError);
            return res.status(500).json({ error: 'Error creating user' });
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.status(201).json({ token, user: formatUserResponse(user) });
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
        // Fetch user with bouncer profile
        // Note: Supabase JS returns relations as arrays (1:M) even for 1:1 if not explicitly singular
        const { data: user, error } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .eq('email', email)
            .single();
        if (error || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.json({ token, user: formatUserResponse(user) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
const registerBouncer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, contactNo, age, gender, profilePhoto, govtIdPhoto, hasGunLicense, gunLicensePhoto, isGunman, registrationType, agencyReferralCode, role } = req.body;
        // Check if user exists
        const { data: existingUser } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('id, name, role')
            .eq('email', email)
            .single();
        let userId = existingUser === null || existingUser === void 0 ? void 0 : existingUser.id;
        let userRole = existingUser === null || existingUser === void 0 ? void 0 : existingUser.role;
        let userName = existingUser === null || existingUser === void 0 ? void 0 : existingUser.name;
        if (!existingUser) {
            // Create New User
            const passwordToHash = password || Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(passwordToHash, 8);
            const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                .from('users')
                .insert({
                email,
                password: hashedPassword,
                name,
                role: role || 'BOUNCER',
            })
                .select()
                .single();
            if (createError)
                throw createError;
            userId = newUser.id;
            userRole = newUser.role;
            userName = newUser.name;
        }
        else {
            // Update User
            yield supabase_1.supabaseAdmin
                .from('users')
                .update({
                name: name || userName,
                role: role || userRole
            })
                .eq('id', userId);
            // Update local vars
            userRole = role || userRole;
        }
        // Upsert Bouncer Profile
        // We first check if it exists or use UPSERT logic
        // Supabase upsert requires primary key or unique constraint. userId is unique in bouncers.
        const bouncerData = {
            userId: userId,
            name,
            contactNo: contactNo,
            age: parseInt(age),
            gender,
            profilePhoto: profilePhoto,
            govtIdPhoto: govtIdPhoto,
            hasGunLicense: hasGunLicense,
            gunLicensePhoto: gunLicensePhoto,
            isGunman: isGunman,
            registrationType: registrationType,
            agencyReferralCode: agencyReferralCode,
            updatedAt: new Date().toISOString()
        };
        const { data: bouncer, error: bouncerError } = yield supabase_1.supabaseAdmin
            .from('bouncers')
            .upsert(bouncerData, { onConflict: 'userId' })
            .select()
            .single();
        if (bouncerError) {
            console.error('Bouncer Upsert Error:', bouncerError);
            throw bouncerError;
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: userId, email, role: userRole }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: userId,
                email,
                name: userName,
                role: userRole,
                bouncerProfile: camelCaseKeys(bouncer)
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
        // Find user by email
        console.log(`[AUTH] Google Auth for email: ${email}`);
        const { data: existingUser, error: findError } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .eq('email', email)
            .single();
        let user = existingUser;
        if (!user && (!findError || findError.code === 'PGRST116')) { // PGRST116 = JSON object requested, multiple (or no) rows returned
            // Create new user
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = yield bcryptjs_1.default.hash(randomPassword, 8);
            const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                .from('users')
                .insert({
                email,
                password: hashedPassword,
                name: name || 'Google User',
                role: 'USER',
                googleId: googleId
            })
                .select()
                .single();
            if (createError)
                throw createError;
            user = newUser;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });
        // Format User Response (attach implicit bouncer profile logic)
        const userFormatted = formatUserResponse(user);
        // Manually fetch bouncer profile if it wasn't pre-fetched (just to be safe)
        if (!userFormatted.bouncerProfile) {
            const { data: bouncer } = yield supabase_1.supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', user.id)
                .single();
            if (bouncer) {
                userFormatted.bouncerProfile = camelCaseKeys(bouncer);
                if (userFormatted.role === 'USER') {
                    userFormatted.role = userFormatted.bouncerProfile.isGunman ? 'GUNMAN' : 'BOUNCER';
                }
            }
        }
        res.json({ token, user: userFormatted });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Internal server error during Google Auth' });
    }
});
exports.googleAuth = googleAuth;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // req.user is populated by authenticate middleware
        if (!req.user || (!req.user.id && !req.user.email)) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // We use email as the reliable lookup if id is authId
        const identifierKey = req.user.email ? 'email' : 'id';
        const identifierValue = req.user.email || req.user.id;
        const { data: user, error } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .eq(identifierKey, identifierValue)
            .single();
        console.log(`[AUTH] getMe lookup by ${identifierKey}: ${identifierValue}, found=${!!user}`);
        if (error || !user) {
            // Need to create the user? Wait, if they signed up directly via Supabase Auth
            if (req.user.email) {
                const role = ((_a = req.user.user_metadata) === null || _a === void 0 ? void 0 : _a.role) || req.user.role || 'USER';
                const { data: newUser, error: createError } = yield supabase_1.supabaseAdmin
                    .from('users')
                    .insert({
                    email: req.user.email,
                    name: ((_b = req.user.user_metadata) === null || _b === void 0 ? void 0 : _b.name) || req.user.email.split('@')[0],
                    role: role,
                    authId: req.user.id // Link the authId
                })
                    .select()
                    .single();
                if (!createError && newUser) {
                    return res.json({ user: formatUserResponse(newUser) });
                }
            }
            return res.status(404).json({ error: 'User profile not found' });
        }
        // Correct role: bouncer profile exists but role is still USER → fix it
        const userFormatted = formatUserResponse(user);
        // Manually fetch bouncer profile if it wasn't pre-fetched (fallback)
        if (!userFormatted.bouncerProfile) {
            const { data: bouncer } = yield supabase_1.supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', user.id)
                .single();
            if (bouncer) {
                userFormatted.bouncerProfile = camelCaseKeys(bouncer);
                // Also fix role in the response if needed
                if (userFormatted.role === 'USER') {
                    userFormatted.role = userFormatted.bouncerProfile.isGunman ? 'GUNMAN' : 'BOUNCER';
                }
            }
        }
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json({ user: userFormatted });
    }
    catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getMe = getMe;
