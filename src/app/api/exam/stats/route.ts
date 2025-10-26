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

        const { questionPool } = Object.fromEntries(
            new URL(request.url).searchParams
        )

        if (!questionPool) {
            return NextResponse.json(
                { error: 'Question pool is required' },
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

        // Get question stats
        const questionStats = await prisma.questionStats.findMany({
            where: {
                userId: user.id,
                question: {
                    questionPoolId: pool.id
                }
            },
            orderBy: {
                questionId: 'asc'
            }
        })

        // Get total questions in the pool
        const totalQuestionsInPool = await prisma.question.count({
            where: { questionPoolId: pool.id }
        })

        // Get overall stats
        const totalAttempts = questionStats.reduce((sum, stat) => sum + stat.countTrue + stat.countFalse, 0)
        const totalCorrect = questionStats.reduce((sum, stat) => sum + stat.countTrue, 0)
        const totalIncorrect = questionStats.reduce((sum, stat) => sum + stat.countFalse, 0)
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
        const uniqueQuestionsEncountered = questionStats.length

        // Get exam sessions for this pool
        const sessions = await prisma.examSession.findMany({
            where: {
                userId: user.id,
                questionPoolId: pool.id,
                endTime: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        })

        const sessionResponses = sessions.map(session => ({
            ...session,
            questionPool: pool.name
        }))

        return NextResponse.json({
            questionStats,
            overallStats: {
                totalAttempts,
                totalCorrect,
                totalIncorrect,
                accuracy: Math.round(accuracy * 100) / 100,
                totalSessions: sessions.length,
                uniqueQuestionsEncountered,
                totalQuestionsInPool
            },
            sessions: sessionResponses
        })

    } catch (error) {
        console.error('Get stats error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
