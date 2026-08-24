import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RouteParams {
    params: Promise<{
        id: string;
        action: string;
    }>;
}

export async function PATCH(
    request: Request,
    { params }: RouteParams
) {
    try {
        const { id, action } = await params;

        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[API PROXY] Forwarding client ${action} to: ${BACKEND_API_URL}/verifications/clients/${id}/${action}`);
        const response = await fetch(`${BACKEND_API_URL}/verifications/clients/${id}/${action}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        console.log(`[API PROXY] Backend responded with status: ${response.status}`);

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
                { error: result.error || result.message || `Failed to ${action} client` },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error processing client verification:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process client verification' },
            { status: 500 }
        );
    }
}
