import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = status
            ? `${BACKEND_API_URL}/verifications?status=${status}`
            : `${BACKEND_API_URL}/verifications`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch verifications');
        }

        const verifications = await response.json();
        return NextResponse.json(verifications);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch verifications' },
            { status: 500 }
        );
    }
}
