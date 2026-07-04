import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const response = await fetch(`${BACKEND_API_URL}/alerts/${id}/acknowledge`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Log the error response text for debugging
            const errorText = await response.text();
            console.error(`Backend error (${response.status}): ${errorText}`);
            throw new Error(`Failed to acknowledge alert: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error acknowledging alert:', error);
        return NextResponse.json(
            { error: 'Failed to acknowledge alert', details: error.message },
            { status: 500 }
        );
    }
}
