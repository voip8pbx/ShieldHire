import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch statistics from backend and Supabase bookings table
        const [bouncersRes, usersRes, bookingsRes] = await Promise.all([
            fetch(`${BACKEND_API_URL}/bouncers`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                cache: 'no-store'
            }),
            fetch(`${BACKEND_API_URL}/users`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                cache: 'no-store'
            }),
            supabase
                .from('bookings')
                .select('status, totalPrice')
        ]);

        const bouncers = bouncersRes.ok ? await bouncersRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];
        const bookings = bookingsRes.data || [];

        const activeEngagements = bookings.filter((b: any) => b.status === 'CONFIRMED').length;
        const totalRevenue = bookings.filter((b: any) => b.status !== 'CANCELLED').reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        const stats = {
            totalBouncers: bouncers.length || 0,
            activeBouncers: bouncers.filter((b: any) => b.isAvailable).length || 0,
            pendingVerifications: bouncers.filter((b: any) => b.verificationStatus === 'PENDING').length || 0,
            totalUsers: users.length || 0,
            activeEngagements: activeEngagements,
            totalRevenue: totalRevenue,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return default stats on error
        return NextResponse.json({
            totalBouncers: 0,
            activeBouncers: 0,
            pendingVerifications: 0,
            totalUsers: 0,
            activeEngagements: 0,
            totalRevenue: 0,
        });
    }
}
