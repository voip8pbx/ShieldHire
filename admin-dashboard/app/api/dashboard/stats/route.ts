import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
    try {
        // Fetch statistics from backend
        const [bouncersRes, usersRes] = await Promise.all([
            fetch(`${BACKEND_API_URL}/bouncers`, { cache: 'no-store' }),
            fetch(`${BACKEND_API_URL}/users`, { cache: 'no-store' }),
        ]);

        const bouncers = bouncersRes.ok ? await bouncersRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];

        const stats = {
            totalBouncers: bouncers.length || 0,
            activeBouncers: bouncers.filter((b: any) => b.isAvailable).length || 0,
            pendingVerifications: bouncers.filter((b: any) => !b.isVerified).length || 0,
            totalUsers: users.length || 0,
            activeEngagements: 0, // TODO: Fetch from bookings endpoint
            totalRevenue: 0, // TODO: Calculate from bookings
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
