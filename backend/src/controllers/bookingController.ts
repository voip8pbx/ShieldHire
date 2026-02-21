import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

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

export const createBooking = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { bouncerId, date, time, location, duration, totalPrice } = req.body;

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .insert({
                userId: userId,
                bouncerId: bouncerId,
                date: new Date(date).toISOString(),
                time: time,
                location: location || 'Location not specified',
                duration: duration || 4,
                totalPrice: totalPrice,
                status: 'PENDING',
            })
            .select()
            .single();

        if (error) throw error;

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
            .in('status', ['CONFIRMED', 'REJECTED'])
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

