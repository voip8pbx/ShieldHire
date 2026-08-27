import { NextRequest, NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';

// API_URL is a server-only env var (no NEXT_PUBLIC_ prefix) set in Vercel project settings.
// Falls back to the production backend URL so the route works even if the var is missing.
const BACKEND_API_URL = process.env.API_URL || 'https://shield-hire-znyu.vercel.app/api';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // 1. Post credentials to the backend login endpoint
        const backendRes = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: data.error || 'Authentication failed' },
                { status: backendRes.status }
            );
        }

        const { token, user } = data;

        // 2. Authorize role: only ADMIN allowed on dashboard
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Access denied. Only administrators are allowed to access the control center.' },
                { status: 403 }
            );
        }

        // 3. Write JWT token into secure HttpOnly cookie
        const cookieStore = await nextCookies();
        cookieStore.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days (matching token expiry)
            path: '/',
        });

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        console.error('[NEXT AUTH] Login route error:', error);
        return NextResponse.json(
            { error: 'Internal server error during authentication' },
            { status: 500 }
        );
    }
}
