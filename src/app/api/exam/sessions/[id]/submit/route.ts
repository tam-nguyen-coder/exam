import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/middleware'

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
            },
            include: {
                questionPool: {
                    include: {
                        questions: {
                            include: {
                                answers: true
                            }
                        }
                    }
                }
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

        if (!session.questionPool) {
            return NextResponse.json(
                { error: 'Question pool not found' },
                { status: 404 }
            )
        }

        // Build a quick lookup map for questions in the pool
        const questionLookup = new Map(
            session.questionPool.questions.map(question => [question.id, question])
        )

        if (questionLookup.size === 0) {
            return NextResponse.json(
                { error: 'Question pool has no questions' },
                { status: 404 }
            )
        }

        let score = 0
        const userAnswers = []

        // Process each answer
        for (const answer of answers) {
            const questionId = String(answer.questionId)
            const selectedAnswerIds = Array.isArray(answer.answerIds)
                ? answer.answerIds.map((id: string | number) => String(id))
                : []

            const question = questionLookup.get(questionId)
            if (!question) continue

            // Check if answer is correct
            const correctAnswerIds = question.answers
                .filter(a => a.isCorrect)
                .map(a => a.id)

            const normalize = (ids: string[]) => Array.from(new Set(ids)).sort()
            const normalizedSelectedIds = normalize(selectedAnswerIds)

            const isCorrect =
                JSON.stringify(normalizedSelectedIds) ===
                JSON.stringify(normalize(correctAnswerIds))

            if (isCorrect) score++

            // Save user answer
            const userAnswer = await prisma.userAnswer.create({
                data: {
                    examSessionId: session.id,
                    questionId,
                    answerIds: normalizedSelectedIds,
                    isCorrect
                }
            })

            userAnswers.push(userAnswer)

            // Update question stats
            await prisma.questionStats.upsert({
                where: {
                    userId_questionId: {
                        userId: user.id,
                        questionId
                    }
                },
                update: {
                    countTrue: isCorrect ? { increment: 1 } : undefined,
                    countFalse: !isCorrect ? { increment: 1 } : undefined,
                    lastAttemptedAt: new Date()
                },
                create: {
                    userId: user.id,
                    questionId,
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
                answers: true,
                questionPool: true
            }
        })

        const { questionPool, ...sessionData } = updatedSession

        return NextResponse.json({
            session: {
                ...sessionData,
                questionPool: questionPool?.name ?? session.questionPool?.name ?? ''
            },
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
