import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch bouncers from backend API
        const response = await fetch(`${BACKEND_API_URL}/bouncers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bouncers');
        }

        const bouncers = await response.json();
        return NextResponse.json(bouncers);
    } catch (error) {
        console.error('Error fetching bouncers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bouncers' },
            { status: 500 }
        );
    }
}
