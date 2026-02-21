import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getIO } from '../socket';

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};

export const createAlert = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { latitude, longitude, location } = req.body;

        const { data: alert, error } = await supabaseAdmin
            .from('emergency_alerts')
            .insert({
                userId: userId,
                latitude,
                longitude,
                location,
                status: 'OPEN'
            })
            .select('*, users(name, email, contactNo)')
            .single();

        if (error) throw error;

        // Fetch user details separately if not returned by insert (depending on RLS/Permissions, insert .select() might not join)
        // With service role, it should work.
        // But let's map it.
        const formattedAlert = camelCaseKeys(alert);
        if (alert.users) {
            formattedAlert.user = camelCaseKeys(alert.users);
            delete formattedAlert.users;
        }

        try {
            getIO().emit('new-alert', formattedAlert);
        } catch (socketError) {
            console.error('Socket emission failed:', socketError);
        }

        res.status(201).json(formattedAlert);
    } catch (error) {
        console.error('Error creating SOS alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getAlerts = async (req: Request, res: Response) => {
    let retries = 3;
    while (retries > 0) {
        try {
            const { data: alerts, error } = await supabaseAdmin
                .from('emergency_alerts')
                .select('*, users(name, email, contactNo)')
                .eq('status', 'OPEN')
                .order('createdAt', { ascending: false })
                .limit(50);

            if (error) throw error;

            const formattedAlerts = alerts.map((alert: any) => {
                const formatted = camelCaseKeys(alert);
                if (alert.users) {
                    formatted.user = camelCaseKeys(alert.users);
                    delete formatted.users;
                }
                return formatted;
            });

            res.json(formattedAlerts);
            return;
        } catch (error: any) {
            console.error(`Error fetching alerts (Attempts left: ${retries - 1}):`, error.message);
            retries -= 1;
            if (retries === 0) {
                res.status(500).json({ error: 'Internal server error', details: error.message });
            } else {
                await delay(1000); // Wait 1 second before retrying
            }
        }
    }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: alert, error } = await supabaseAdmin
            .from('emergency_alerts')
            .update({ status: 'ACKNOWLEDGED' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(camelCaseKeys(alert));
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
};

