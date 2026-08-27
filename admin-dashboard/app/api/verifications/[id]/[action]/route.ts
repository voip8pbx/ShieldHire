import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.API_URL || 'https://shield-hire-znyu.vercel.app/api';

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
        const backendRes = await fetch(`${BACKEND_API_URL}/verifications/${id}/${action}`, {
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
                { error: data.error || `Failed to ${action} bouncer` },
                { status: backendRes.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error processing bouncer verification:', error);
        return NextResponse.json({ error: error.message || 'Failed to process verification' }, { status: 500 });
    }
}
