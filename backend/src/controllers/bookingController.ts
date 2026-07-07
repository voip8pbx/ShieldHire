import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getIO } from '../socket';
import { sendPushToToken } from '../utils/fcmAdmin';

// Helper to parse location strings containing bundled coordinates
const parseLocation = (obj: any): any => {
    if (!obj || !obj.location) return obj;
    // Check if the location string has our secret COORDS delimiter
    const parts = obj.location.split('|COORDS:');
    if (parts.length > 1) {
        obj.location = parts[0];
        const coords = parts[1].split(',');
        obj.latitude = parseFloat(coords[0]);
        obj.longitude = parseFloat(coords[1]);
    } else {
        // If not, ensure latitude and longitude are null so frontend doesn't break
        obj.latitude = null;
        obj.longitude = null;
    }
    return obj;
};

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    // First, decode the coordinates if they were bundled in the location string
    const parsedObj = parseLocation({ ...obj });
    const newObj: any = {};
    for (const key in parsedObj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = parsedObj[key];
    }
    return newObj;
};

export const createBooking = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const clientName: string = (req as any).user.name || 'A client';
        const { bouncerId, date, time, location, latitude, longitude, duration, totalPrice, package: pkg, notes } = req.body;

        // Fetch client's contact number to denormalize into the booking
        const { data: clientUser } = await supabaseAdmin
            .from('users')
            .select('contactNo')
            .eq('id', userId)
            .single();
        const clientContactNo = clientUser?.contactNo || null;

        // Since the database schema might not have latitude/longitude columns yet,
        // we securely bundle them into the location text field.
        let finalLocation = location || 'Location not specified';
        if (latitude !== undefined && longitude !== undefined && latitude !== null) {
            finalLocation = `${finalLocation}|COORDS:${latitude},${longitude}`;
        }

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .insert({
                userId: userId,
                bouncerId: bouncerId,
                date: new Date(date).toISOString(),
                time: time,
                location: finalLocation,
                duration: duration || 4,
                totalPrice: totalPrice,
                package: pkg || 'SINGLE_SHIFT',
                notes: notes || null,
                clientName: clientName,
                clientContactNo: clientContactNo,
                status: 'PENDING',
            })
            .select()
            .single();

        if (error) throw error;

        // ── 1. Real-time: emit socket event (works when app is open) ─────────
        getIO().emit('new-booking', {
            bouncerId: bouncerId,
            booking: camelCaseKeys(booking),
            clientName,
        });

        // ── 2. Push notification: works in background / killed state ─────────
        // Look up the bouncer's userId so we can fetch their FCM token
        const { data: bouncerUser } = await supabaseAdmin
            .from('bouncers')
            .select('userId')
            .eq('id', bouncerId)
            .single();

        if (bouncerUser?.userId) {
            const { data: userRow } = await supabaseAdmin
                .from('users')
                .select('fcm_token')
                .eq('id', bouncerUser.userId)
                .single();

            if (userRow?.fcm_token) {
                sendPushToToken(
                    userRow.fcm_token,
                    'New Hire Request! 🛡️',
                    `${clientName} wants to hire you${date ? ` on ${new Date(date).toLocaleDateString()}` : ''}.`,
                    {
                        type: 'BOOKING_REQUEST',
                        bookingId: booking.id,
                        clientName,
                    },
                ).catch(err => console.error('[FCM] Bouncer notify failed:', err?.code));
            } else {
                console.log('[FCM] Bouncer has no FCM token — push skipped');
            }
        }

        res.status(201).json(camelCaseKeys(booking));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, bouncers(name, profilePhoto, contactNo)')
            .eq('userId', userId)
            .order('date', { ascending: true });

        if (error) throw error;

        const formattedBookings = bookings.map((booking: any) => {
            const formatted = camelCaseKeys(booking);

            if (booking.bouncers) {
                const bouncer = Array.isArray(booking.bouncers) ? booking.bouncers[0] : booking.bouncers;
                if (bouncer) {
                    formatted.bouncer = camelCaseKeys(bouncer);
                }
                delete formatted.bouncers;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Get User Bookings Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPendingBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find the bouncer profile associated with the user
        const { data: bouncer, error: bouncerError } = await supabaseAdmin
            .from('bouncers')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!bouncer || bouncerError) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(name, contactNo, email, profilePhoto)')
            .eq('bouncerId', bouncer.id)
            .eq('status', 'PENDING')
            .order('date', { ascending: true });

        if (error) throw error;

        const formattedBookings = bookings.map((booking: any) => {
            const formatted = camelCaseKeys(booking);
            if (booking.users) {
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                formatted.user = camelCaseKeys(user);
                delete formatted.users;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching pending bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // CONFIRMED or REJECTED

        if (!['CONFIRMED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // ── Push notification → CLIENT: inform them of the bouncer's decision ─
        if (booking?.userId) {
            const { data: clientRow } = await supabaseAdmin
                .from('users')
                .select('fcm_token, name')
                .eq('id', booking.userId)
                .single();

            if (clientRow?.fcm_token) {
                const isConfirmed = status === 'CONFIRMED';
                sendPushToToken(
                    clientRow.fcm_token,
                    isConfirmed ? 'Booking Confirmed! ✅' : 'Booking Declined ❌',
                    isConfirmed
                        ? 'Your security hire has been confirmed. Get ready!'
                        : 'The bouncer is unavailable. Please try another.',
                    {
                        type: isConfirmed ? 'HIRE_CONFIRMED' : 'HIRE_REJECTED',
                        bookingId: booking.id,
                    },
                ).catch(err => console.error('[FCM] Client notify failed:', err?.code));
            }
        }

        res.json(camelCaseKeys(booking));
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBouncerHistoryBookings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find the bouncer profile associated with the user
        const { data: bouncer, error: bouncerError } = await supabaseAdmin
            .from('bouncers')
            .select('id')
            .eq('userId', userId)
            .single();

        if (!bouncer || bouncerError) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(name, contactNo, email, profilePhoto)')
            .eq('bouncerId', bouncer.id)
            .in('status', ['CONFIRMED', 'REJECTED', 'PENDING'])
            .order('updatedAt', { ascending: false });

        if (error) throw error;

        const formattedBookings = bookings.map((booking: any) => {
            const formatted = camelCaseKeys(booking);
            if (booking.users) {
                const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
                formatted.user = camelCaseKeys(user);
                delete formatted.users;
            }
            return formatted;
        });

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching history bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBookingDetail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        // Fetch booking with user and bouncer details
        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select('*, users(id, name, contactNo, email, profilePhoto), bouncers(id, name, contactNo, profilePhoto)')
            .eq('id', id)
            .single();

        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Security Check: Only the assigned bouncer or the user who created it can view
        const { data: bouncer } = await supabaseAdmin
            .from('bouncers')
            .select('userId')
            .eq('id', booking.bouncerId)
            .single();

        const isAssignedBouncer = bouncer?.userId === userId;
        const isCreator = booking.userId === userId;

        if (!isAssignedBouncer && !isCreator) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const formatted = camelCaseKeys(booking);
        if (booking.users) {
            formatted.user = camelCaseKeys(booking.users);
            delete formatted.users;
        }
        if (booking.bouncers) {
            formatted.bouncer = camelCaseKeys(booking.bouncers);
            delete formatted.bouncers;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Get Booking Detail Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

