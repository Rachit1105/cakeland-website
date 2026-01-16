import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow /admin/login to be publicly accessible
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    // Check for admin session cookie on all other /admin routes
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession || adminSession.value !== 'true') {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Allow authenticated users to proceed
    return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
    matcher: '/admin/:path*'
};
