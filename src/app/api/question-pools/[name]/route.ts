import { NextRequest, NextResponse } from 'next/server'
import { loadQuestionPoolServer } from '@/utils/question-pool-loader'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params
        const poolName = decodeURIComponent(name)
        const questionPool = await loadQuestionPoolServer(poolName)

        if (!questionPool) {
            return NextResponse.json(
                { error: 'Question pool not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ questionPool })
    } catch (error) {
        console.error('Error loading question pool:', error)
        return NextResponse.json(
            { error: 'Failed to load question pool' },
            { status: 500 }
        )
    }
}
