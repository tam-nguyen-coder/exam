import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { id } = await params;
        const userId = decoded.userId;

        // Get the exam session to verify ownership
        const examSession = await prisma.examSession.findFirst({
            where: {
                id,
                userId
            },
            include: {
                answers: true
            }
        });

        if (!examSession) {
            return NextResponse.json({ error: 'Exam session not found' }, { status: 404 });
        }

        // Get all question IDs from this exam session
        const questionIds = examSession.questionIds;

        // Start a transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
            // Delete all user answers for this exam session
            await tx.userAnswer.deleteMany({
                where: { examSessionId: id }
            });

            // Delete the exam session
            await tx.examSession.delete({
                where: { id }
            });

            // Update question stats for all questions in this exam session
            for (const questionId of questionIds) {
                // Get current question stats
                const questionStats = await tx.questionStats.findUnique({
                    where: {
                        userId_questionId: {
                            userId,
                            questionId
                        }
                    }
                });

                if (questionStats) {
                    // Get all remaining user answers for this question
                    const remainingAnswers = await tx.userAnswer.findMany({
                        where: {
                            questionId,
                            examSession: {
                                userId
                            }
                        }
                    });

                    // Recalculate stats based on remaining answers
                    const countTrue = remainingAnswers.filter(answer => answer.isCorrect).length;
                    const countFalse = remainingAnswers.filter(answer => !answer.isCorrect).length;
                    const totalAttempts = countTrue + countFalse;
                    const accuracy = totalAttempts > 0 ? (countTrue / totalAttempts) * 100 : 0;

                    // Update or delete question stats
                    if (totalAttempts > 0) {
                        await tx.questionStats.update({
                            where: {
                                userId_questionId: {
                                    userId,
                                    questionId
                                }
                            },
                            data: {
                                countTrue,
                                countFalse,
                                lastAttemptedAt: remainingAnswers.length > 0
                                    ? remainingAnswers[remainingAnswers.length - 1].createdAt
                                    : null
                            }
                        });
                    } else {
                        // Delete question stats if no remaining attempts
                        await tx.questionStats.delete({
                            where: {
                                userId_questionId: {
                                    userId,
                                    questionId
                                }
                            }
                        });
                    }
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting exam session:', error);
        return NextResponse.json(
            { error: 'Failed to delete exam session' },
            { status: 500 }
        );
    }
}
