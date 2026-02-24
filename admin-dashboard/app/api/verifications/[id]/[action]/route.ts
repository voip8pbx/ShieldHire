import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Update interface for Next.js 15+
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

        const body = await request.json();

        console.log(`[API PROXY] Forwarding ${action} to: ${BACKEND_API_URL}/verifications/${id}/${action}`);
        const response = await fetch(`${BACKEND_API_URL}/verifications/${id}/${action}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
                { error: result.error || result.message || `Failed to ${action} bouncer` },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error processing bouncer verification:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process bouncer verification' },
            { status: 500 }
        );
    }
}
