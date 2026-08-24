import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getIO, onlineBouncers } from '../socket';
import { sendPushToToken } from '../utils/fcmAdmin';

const SOS_RADIUS_KM = 10;

// Haversine formula — returns distance in km between two coordinates
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
            .insert({ userId, latitude, longitude, location, status: 'OPEN' })
            .select('*, users(name, email, contactNo)')
            .single();

        if (error) throw error;

        const formattedAlert = camelCaseKeys(alert);
        if (alert.users) {
            formattedAlert.user = camelCaseKeys(alert.users);
            delete formattedAlert.users;
        }

        // ── 1. Notify nearby ONLINE bouncers via Socket.io ──────────────────
        const nearbySocketIds: string[] = [];
        const notifiedBouncerIds = new Set<string>();

        onlineBouncers.forEach((bouncer, socketId) => {
            const dist = getDistanceKm(latitude, bouncer.lat, longitude, bouncer.lng);
            if (dist <= SOS_RADIUS_KM) {
                try {
                    getIO().to(socketId).emit('new-alert', formattedAlert);
                    nearbySocketIds.push(socketId);
                    notifiedBouncerIds.add(bouncer.bouncerId);
                } catch (e) {
                    console.error('[SOS] Socket emit failed for', socketId);
                }
            }
        });

        console.log(`[SOS] Notified ${nearbySocketIds.length} online bouncer(s) within ${SOS_RADIUS_KM}km`);

        // ── 2. FCM push to APPROVED bouncers who are offline or out of range ─
        try {
            const { data: allBouncers } = await supabaseAdmin
                .from('bouncers')
                .select('id, userId, users(fcm_token)')
                .eq('verificationStatus', 'APPROVED')
                .eq('isAvailable', true);

            if (allBouncers && allBouncers.length > 0) {
                const senderName = formattedAlert.user?.name || 'Someone';
                const pushBody = `🚨 ${senderName} needs help nearby! Tap to view location.`;

                const pushPromises = allBouncers
                    .filter((b: any) => {
                        // Skip bouncers already notified via socket
                        if (notifiedBouncerIds.has(b.id)) return false;
                        const token = Array.isArray(b.users) ? b.users[0]?.fcm_token : b.users?.fcm_token;
                        return !!token;
                    })
                    .map((b: any) => {
                        const token = Array.isArray(b.users) ? b.users[0]?.fcm_token : b.users?.fcm_token;
                        return sendPushToToken(
                            token,
                            '🚨 Emergency SOS Alert',
                            pushBody,
                            {
                                type: 'SOS_ALERT',
                                alertId: String(formattedAlert.id || ''),
                                latitude: String(latitude),
                                longitude: String(longitude),
                                location: location || '',
                            }
                        ).catch((err) => console.error('[FCM] Push failed for bouncer', b.id, err?.code));
                    });

                await Promise.allSettled(pushPromises);
                console.log(`[SOS] FCM push sent to ${pushPromises.length} offline bouncer(s)`);
            }
        } catch (fcmErr) {
            console.error('[SOS] FCM batch push error:', fcmErr);
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
                await delay(1000);
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
