import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const cookieStore = await cookies();
        if (!cookieStore.get('admin_token')?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [bouncersRes, usersRes, bookingsRes] = await Promise.all([
            supabaseAdmin.from('bouncers').select('id, isAvailable, verificationStatus'),
            supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('bookings').select('status, totalPrice'),
        ]);

        const bouncers = bouncersRes.data || [];
        const totalUsers = usersRes.count || 0;
        const bookings = bookingsRes.data || [];

        const activeEngagements = bookings.filter((b: any) => b.status === 'CONFIRMED').length;
        const totalRevenue = bookings
            .filter((b: any) => b.status !== 'CANCELLED')
            .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        return NextResponse.json({
            totalBouncers: bouncers.length,
            activeBouncers: bouncers.filter((b: any) => b.isAvailable).length,
            pendingVerifications: bouncers.filter((b: any) => b.verificationStatus === 'PENDING').length,
            totalUsers,
            activeEngagements,
            totalRevenue,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({
            totalBouncers: 0, activeBouncers: 0, pendingVerifications: 0,
            totalUsers: 0, activeEngagements: 0, totalRevenue: 0,
        });
    }
}
