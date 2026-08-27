import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://shield-hire-znyu.vercel.app/api').replace('localhost', '127.0.0.1');

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function PATCH(
    request: Request,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        console.log(`[API PROXY] Forwarding booking status update for ${id} to backend...`);
        const response = await fetch(`${BACKEND_API_URL}/bookings/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body),
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('Failed to parse backend response:', e);
            throw new Error(`Invalid response from backend (Status: ${response.status})`);
        }

        if (!response.ok) {
            console.error(`Backend returned error: ${response.status}`, result);
            return NextResponse.json(
                { error: result.error || result.message || 'Failed to update booking status' },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error processing booking status update:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process booking status update' },
            { status: 500 }
        );
    }
}
