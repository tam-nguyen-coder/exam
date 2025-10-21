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
                answers: true,
                questionPool: true
            }
        })

        const sessionResponses = sessions.map(({ questionPool, ...sessionData }) => ({
            ...sessionData,
            questionPool: questionPool?.name ?? ''
        }))

        return NextResponse.json({ sessions: sessionResponses })

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

        const pool = await prisma.questionPool.findUnique({
            where: { name: questionPool }
        })

        if (!pool) {
            return NextResponse.json(
                { error: 'Question pool not found' },
                { status: 404 }
            )
        }

        const session = await prisma.examSession.create({
            data: {
                userId: user.id,
                questionPoolId: pool.id,
                questionCount,
                timeLimit,
                startTime: new Date()
            },
            include: {
                questionPool: true
            }
        })

        const { questionPool: createdPool, ...sessionData } = session

        return NextResponse.json({
            session: {
                ...sessionData,
                questionPool: createdPool?.name ?? pool.name
            }
        })

    } catch (error) {
        console.error('Create session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
