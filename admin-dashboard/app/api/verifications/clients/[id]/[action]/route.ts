import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://shield-hire-znyu.vercel.app/api').replace('localhost', '127.0.0.1');

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; action: string }> }
) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_token')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, action } = await params;
        const body = await request.json().catch(() => ({}));

        // Proxy to the backend — FCM push, role update etc. all handled there
        const backendRes = await fetch(`${BACKEND_API_URL}/verifications/clients/${id}/${action}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json().catch(() => ({}));

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data.error || `Failed to ${action} client` },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error processing client verification:', error);
        return NextResponse.json({ error: error.message || 'Failed to process client verification' }, { status: 500 });
    }
}
