import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;

        // Update bouncer via backend API
        const response = await fetch(`${BACKEND_API_URL}/bouncers/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Failed to update bouncer');
        }

        const updatedBouncer = await response.json();
        return NextResponse.json(updatedBouncer);
    } catch (error) {
        console.error('Error updating bouncer:', error);
        return NextResponse.json(
            { error: 'Failed to update bouncer' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const response = await fetch(`${BACKEND_API_URL}/bouncers/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bouncer');
        }

        const bouncer = await response.json();
        return NextResponse.json(bouncer);
    } catch (error) {
        console.error('Error fetching bouncer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bouncer' },
            { status: 500 }
        );
    }
}
