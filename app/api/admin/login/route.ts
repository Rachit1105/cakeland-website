import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { adminId, password } = await request.json();

        // Validate credentials against environment variables
        const validAdminId = process.env.ADMIN_ID;
        const validPassword = process.env.ADMIN_PASSWORD;

        if (!validAdminId || !validPassword) {
            return NextResponse.json(
                { error: 'Admin credentials not configured' },
                { status: 500 }
            );
        }

        if (adminId === validAdminId && password === validPassword) {
            // Create response with success
            const response = NextResponse.json({ success: true });

            // Set HTTP-only cookie for session
            response.cookies.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/'
            });

            return response;
        } else {
            // Invalid credentials
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
