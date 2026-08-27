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
            supabaseAdmin
                .from('bouncers')
                .select('id, name, contactNo, verificationStatus, rating, isAvailable'),
            supabaseAdmin
                .from('users')
                .select('id, name, email, role'),
            supabaseAdmin
                .from('bookings')
                .select('id, userId, bouncerId, date, status, totalPrice, bouncers(name)'),
        ]);

        const bouncers: any[] = bouncersRes.data || [];
        const users: any[] = usersRes.data || [];
        const bookings: any[] = bookingsRes.data || [];

        const rows: string[] = [
            '--- BOUNCERS ---',
            'ID,Name,Contact,Status,Rating,Available',
            ...bouncers.map(b =>
                [b.id, b.name, b.contactNo, b.verificationStatus, b.rating, b.isAvailable].join(',')
            ),
            '',
            '--- USERS ---',
            'ID,Name,Email,Role',
            ...users.map(u => [u.id, u.name, u.email, u.role].join(',')),
            '',
            '--- BOOKINGS ---',
            'ID,BouncerName,Date,Status,Amount',
            ...bookings.map(b =>
                [
                    b.id,
                    (Array.isArray(b.bouncers) ? b.bouncers[0]?.name : b.bouncers?.name) || '',
                    b.date ? new Date(b.date).toLocaleDateString() : '',
                    b.status,
                    b.totalPrice,
                ].join(',')
            ),
        ];

        return new NextResponse(rows.join('\n'), {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="shieldhire-report-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
