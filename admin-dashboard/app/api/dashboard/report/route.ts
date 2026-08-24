import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [bouncersRes, usersRes, bookingsRes] = await Promise.all([
            fetch(`${BACKEND_API_URL}/bouncers`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch(`${BACKEND_API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch(`${BACKEND_API_URL}/bookings/admin/all`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
        ]);

        const bouncers: any[] = bouncersRes.ok ? await bouncersRes.json() : [];
        const users: any[] = usersRes.ok ? await usersRes.json() : [];
        const bookings: any[] = bookingsRes.ok ? await bookingsRes.json() : [];

        const rows: string[] = [
            '--- BOUNCERS ---',
            'ID,Name,Contact,Status,Rating,Available',
            ...bouncers.map(b =>
                [b.id, b.name, b.contactNo, b.verificationStatus, b.rating, b.isAvailable].join(',')
            ),
            '',
            '--- USERS ---',
            'ID,Name,Email,Role',
            ...users.map(u =>
                [u.id, u.name, u.email, u.role].join(',')
            ),
            '',
            '--- BOOKINGS ---',
            'ID,Client,Bouncer,Date,Status,Amount,PaymentStatus',
            ...bookings.map(b =>
                [
                    b.id,
                    b.clientName || '',
                    b.bouncer?.name || '',
                    b.date ? new Date(b.date).toLocaleDateString() : '',
                    b.status,
                    b.totalPrice,
                    b.paymentStatus || '',
                ].join(',')
            ),
        ];

        const csv = rows.join('\n');

        return new NextResponse(csv, {
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
