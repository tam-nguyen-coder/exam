import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/middleware'
import { loadQuestionPools } from '@/utils/question-pool-loader'

export async function POST(
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

        const { answers } = await request.json()

        const { id } = await params;
        // Get session
        const session = await prisma.examSession.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        if (session.endTime) {
            return NextResponse.json(
                { error: 'Session already submitted' },
                { status: 400 }
            )
        }

        // Load question pool to validate answers
        const questionPools = await loadQuestionPools()
        const pool = questionPools.find(p => p.filename === session.questionPool)

        if (!pool) {
            return NextResponse.json(
                { error: 'Question pool not found' },
                { status: 404 }
            )
        }

        let score = 0
        const userAnswers = []

        // Process each answer
        for (const answer of answers) {
            const question = pool.questions.find(q => q.id === answer.questionId)
            if (!question) continue

            // Check if answer is correct
            const correctAnswerIds = question.answers
                .filter(a => a.correct)
                .map(a => a.id)

            const isCorrect = JSON.stringify(answer.answerIds.sort()) ===
                JSON.stringify(correctAnswerIds.sort())

            if (isCorrect) score++

            // Save user answer
            const userAnswer = await prisma.userAnswer.create({
                data: {
                    examSessionId: session.id,
                    questionId: answer.questionId,
                    answerIds: answer.answerIds,
                    isCorrect
                }
            })

            userAnswers.push(userAnswer)

            // Update question stats
            await prisma.questionStats.upsert({
                where: {
                    userId_questionPool_questionId: {
                        userId: user.id,
                        questionPool: session.questionPool,
                        questionId: answer.questionId
                    }
                },
                update: {
                    countTrue: isCorrect ? { increment: 1 } : undefined,
                    countFalse: !isCorrect ? { increment: 1 } : undefined,
                    lastAttemptedAt: new Date()
                },
                create: {
                    userId: user.id,
                    questionPool: session.questionPool,
                    questionId: answer.questionId,
                    countTrue: isCorrect ? 1 : 0,
                    countFalse: !isCorrect ? 1 : 0,
                    lastAttemptedAt: new Date()
                }
            })
        }

        // Update session
        const updatedSession = await prisma.examSession.update({
            where: { id: session.id },
            data: {
                endTime: new Date(),
                score,
                totalQuestions: answers.length
            },
            include: {
                answers: true
            }
        })

        return NextResponse.json({
            session: updatedSession,
            score,
            totalQuestions: answers.length
        })

    } catch (error) {
        console.error('Submit session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
