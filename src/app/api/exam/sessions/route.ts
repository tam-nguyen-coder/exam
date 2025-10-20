import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/middleware'

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request)
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const sessions = await prisma.examSession.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                answers: true
            }
        })

        return NextResponse.json({ sessions })

    } catch (error) {
        console.error('Get sessions error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request)
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { questionPool, questionCount, timeLimit } = await request.json()

        if (!questionPool || !questionCount || !timeLimit) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const session = await prisma.examSession.create({
            data: {
                userId: user.id,
                questionPool,
                questionCount,
                timeLimit,
                startTime: new Date()
            }
        })

        return NextResponse.json({ session })

    } catch (error) {
        console.error('Create session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
