import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * GET /api/system/keep-alive
 *
 * Pings the database with the lightest possible read-only query to prevent
 * the Supabase Free Plan database from pausing due to inactivity.
 *
 * - Reads exactly ONE id from the `clients` table (smallest table in schema).
 * - Never selects *, never writes, never deletes.
 * - Protected by KEEP_ALIVE_SECRET bearer token (see keepAliveAuth middleware).
 */
export const keepAlive = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
        console.log('[KeepAlive] Pinging database...');

        const { data, error } = await supabaseAdmin
            .from('clients')
            .select('id')
            .limit(1);

        if (error) {
            const elapsed = Date.now() - startTime;
            console.error(`[KeepAlive] Database ping FAILED after ${elapsed}ms:`, error.message);
            res.status(503).json({
                success: false,
                message: 'Database is unavailable.',
                timestamp: new Date().toISOString(),
                responseTime: `${elapsed}ms`,
            });
            return;
        }

        const elapsed = Date.now() - startTime;
        console.log(`[KeepAlive] Database ping successful in ${elapsed}ms`);

        res.status(200).json({
            success: true,
            message: 'Database is active',
            timestamp: new Date().toISOString(),
            responseTime: `${elapsed}ms`,
        });

    } catch (err: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[KeepAlive] Unexpected error after ${elapsed}ms:`, err.message);
        res.status(503).json({
            success: false,
            message: 'Database is unavailable.',
            timestamp: new Date().toISOString(),
            responseTime: `${elapsed}ms`,
        });
    }
};
