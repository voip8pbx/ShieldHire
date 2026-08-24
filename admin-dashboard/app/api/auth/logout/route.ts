import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await nextCookies();
        
        // Delete the admin token cookie
        cookieStore.set('admin_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[NEXT AUTH] Logout route error:', error);
        return NextResponse.json(
            { error: 'Internal server error during logout' },
            { status: 500 }
        );
    }
}
