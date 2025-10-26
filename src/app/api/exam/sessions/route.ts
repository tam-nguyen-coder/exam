import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/middleware'
import { computeQuestionScore } from '@/utils/question-score'

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

        const { questionPool, questionCount, timeLimit, isRandomMode = false } = await request.json()

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

        const poolQuestions = await prisma.question.findMany({
            where: { questionPoolId: pool.id },
            select: {
                id: true,
                questionStats: {
                    where: { userId: user.id },
                    select: {
                        countTrue: true,
                        countFalse: true
                    },
                    take: 1
                }
            }
        })

        if (poolQuestions.length === 0) {
            return NextResponse.json(
                { error: 'Question pool has no questions' },
                { status: 400 }
            )
        }

        const availableCount = poolQuestions.length
        const limitedQuestionCount = Math.min(questionCount, availableCount)

        if (limitedQuestionCount <= 0) {
            return NextResponse.json(
                { error: 'Invalid question count' },
                { status: 400 }
            )
        }

        let selectedQuestionIds: string[]

        if (isRandomMode) {
            // Random mode: select questions randomly
            const shuffledQuestions = [...poolQuestions].sort(() => Math.random() - 0.5)
            selectedQuestionIds = shuffledQuestions
                .slice(0, limitedQuestionCount)
                .map(q => q.id)
        } else {
            // Smart mode: use question stats for intelligent selection
            const weightedQuestions = poolQuestions.map(question => {
                const stats = question.questionStats[0]
                const hasStats = question.questionStats && question.questionStats.length > 0;
                const score = hasStats
                    ? computeQuestionScore(stats.countTrue, stats.countFalse)
                    : 0 // Default score for questions that have never been attempted

                return {
                    id: question.id,
                    hasStats,
                    score,
                }
            })

            weightedQuestions.sort((a, b) => {
                return a.score - b.score
            })

            selectedQuestionIds = weightedQuestions
                .slice(0, limitedQuestionCount)
                .map(q => q.id)
        }

        const session = await prisma.examSession.create({
            data: {
                userId: user!.id,
                questionPoolId: pool!.id,
                questionCount: limitedQuestionCount,
                timeLimit,
                startTime: new Date(),
                questionIds: selectedQuestionIds
            },
            include: {
                questionPool: true
            }
        })

        const { questionPool: createdPool, ...sessionData } = session

        return NextResponse.json({
            session: {
                ...sessionData,
                questionPool: createdPool?.name ?? pool!.name
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
