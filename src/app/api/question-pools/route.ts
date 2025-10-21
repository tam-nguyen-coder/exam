import { NextResponse } from 'next/server'
import { loadQuestionPoolsServer } from '@/utils/question-pool-loader'

export async function GET() {
    try {
        const questionPools = await loadQuestionPoolsServer()

        return NextResponse.json({
            questionPools
        })
    } catch (error) {
        console.error('Error loading question pools:', error)
        return NextResponse.json(
            { error: 'Failed to load question pools' },
            { status: 500 }
        )
    }
}
