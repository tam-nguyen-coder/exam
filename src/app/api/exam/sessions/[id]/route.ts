import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/middleware'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await authenticateRequest(request)
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params;
        const session = await prisma.examSession.findFirst({
            where: {
                id,
                userId: user.id
            },
            include: {
                answers: true,
                questionPool: true
            }
        })

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        const { questionPool, ...sessionData } = session

        return NextResponse.json({
            session: {
                ...sessionData,
                questionPool: questionPool?.name ?? ''
            }
        })

    } catch (error) {
        console.error('Get session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
