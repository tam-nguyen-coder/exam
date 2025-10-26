import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const resolvedParams = await params
        const questionPoolName = resolvedParams.name

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 50) {
            return NextResponse.json(
                { error: 'Invalid pagination parameters' },
                { status: 400 }
            )
        }

        // Find the question pool
        const pool = await prisma.questionPool.findUnique({
            where: { name: questionPoolName }
        })

        if (!pool) {
            return NextResponse.json(
                { error: 'Question pool not found' },
                { status: 404 }
            )
        }

        // Calculate pagination
        const skip = (page - 1) * limit

        // Get total count
        const totalQuestions = await prisma.question.count({
            where: { questionPoolId: pool.id }
        })

        // Get questions with answers
        const questions = await prisma.question.findMany({
            where: { questionPoolId: pool.id },
            include: {
                answers: {
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { id: 'asc' },
            skip,
            take: limit
        })

        // Calculate pagination info
        const totalPages = Math.ceil(totalQuestions / limit)
        const hasNextPage = page < totalPages
        const hasPrevPage = page > 1

        return NextResponse.json({
            questions,
            pagination: {
                currentPage: page,
                totalPages,
                totalQuestions,
                limit,
                hasNextPage,
                hasPrevPage
            },
            pool: {
                id: pool.id,
                name: pool.name,
                description: pool.description
            }
        })

    } catch (error) {
        console.error('Get questions error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
