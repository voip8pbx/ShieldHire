import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // Bypass public static assets, api/auth routes, and public pages
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/delete-request') ||
        pathname.startsWith('/delete-account') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    if (!token) {
        // For API routes, return a 401 JSON response instead of redirecting to HTML page
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Redirect to /login if token is missing and accessing protected pages
        if (pathname !== '/login') {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    } else {
        // Redirect to / if token is present and trying to access /login
        if (pathname === '/login') {
            const dashboardUrl = new URL('/', request.url);
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
