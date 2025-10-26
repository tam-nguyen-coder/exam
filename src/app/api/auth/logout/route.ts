import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // For JWT-based authentication, logout is handled on the client side
        // by removing the token from localStorage/sessionStorage
        // The server doesn't need to do anything special since JWT is stateless

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        );
    }
}
