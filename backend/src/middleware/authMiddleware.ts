import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { firebaseAuth } from '../config/firebase';
import { supabaseAdmin } from '../config/supabase';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // ── 1. Try Firebase ID Token first ──────────────────────────────────
        try {
            const decoded = await firebaseAuth.verifyIdToken(token);
            const firebaseUid = decoded.uid;
            const email = decoded.email;

            if (!email) {
                return res.status(401).json({ error: 'Firebase token missing email.' });
            }

            // Look up the real user in Supabase DB also fetching bouncer profile
            let { data: dbUser } = await supabaseAdmin
                .from('users')
                .select('*, bouncers(*)')
                .eq('email', email)
                .single();

            if (!dbUser) {
                // Auto-create the user on first Firebase login
                const { data: newUser, error: createError } = await supabaseAdmin
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
                dbUser = { ...newUser, bouncers: [] };
            } else if (!dbUser.googleId) {
                // Update googleId if missing
                await supabaseAdmin
                    .from('users')
                    .update({ googleId: firebaseUid })
                    .eq('id', dbUser.id);
            }

            // Correct role: bouncer profile exists but role is still USER → fix it
            const hasBouncer = dbUser.bouncers && dbUser.bouncers.length > 0;
            if (hasBouncer && dbUser.role === 'USER') {
                dbUser.role = 'BOUNCER';
            }

            req.user = {
                ...dbUser,
                firebaseUid,
            };
            return next();

        } catch (_firebaseErr) {
            // Not a Firebase token — fall through to Supabase
        }

        // ── 2. Fallback: Try Supabase Auth token ────────────────────────────
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (user && !error) {
                let { data: dbUser } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('authId', user.id)
                    .single();

                if (!dbUser && user.email) {
                    const { data: dbUserByEmail } = await supabaseAdmin
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single();
                    dbUser = dbUserByEmail;

                    if (dbUser && !dbUser.authId) {
                        await supabaseAdmin.from('users').update({ authId: user.id }).eq('id', dbUser.id);
                    }
                }

                if (dbUser) {
                    req.user = dbUser;
                } else {
                    req.user = { id: user.id, email: user.email, role: user.user_metadata?.role || 'USER' };
                }
                return next();
            }
        } catch (_supabaseErr) {
            // Not a Supabase token — fall through to legacy JWT
        }

        // ── 3. Last resort: Legacy custom JWT ──────────────────────────────
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();

    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
