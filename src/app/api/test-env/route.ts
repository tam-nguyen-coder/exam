import { NextResponse } from 'next/server';

export async function GET() {
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasJwtSecret = !!process.env.JWT_SECRET;

    return NextResponse.json({
        hasDatabaseUrl,
        hasJwtSecret,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV
    });
}
