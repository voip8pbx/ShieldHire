import { Request, Response, NextFunction } from 'express';

/**
 * Middleware: validates the static KEEP_ALIVE_SECRET bearer token.
 * This is intentionally separate from the main `authenticate` middleware
 * to keep the keep-alive system fully isolated from business logic.
 */
export const keepAliveAuth = (req: Request, res: Response, next: NextFunction): void => {
    const secret = process.env.KEEP_ALIVE_SECRET;

    if (!secret) {
        console.error('[KeepAlive] KEEP_ALIVE_SECRET is not configured on this server.');
        res.status(500).json({ error: 'Keep-alive endpoint is not configured.' });
        return;
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        console.warn('[KeepAlive] Unauthorized access attempt — no token provided.');
        res.status(401).json({ error: 'Unauthorized. Authorization header is required.' });
        return;
    }

    if (token !== secret) {
        console.warn('[KeepAlive] Unauthorized access attempt — invalid token.');
        res.status(401).json({ error: 'Unauthorized. Invalid token.' });
        return;
    }

    next();
};
