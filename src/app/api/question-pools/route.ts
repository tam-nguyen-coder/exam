import { NextResponse } from 'next/server'
import {
    loadQuestionPoolSummariesServer,
    loadQuestionPoolsServer
} from '@/utils/question-pool-loader'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const detail = searchParams.get('detail')
        const includeQuestions = detail === '1' || detail === 'true'

        if (includeQuestions) {
            const questionPools = await loadQuestionPoolsServer()
            return NextResponse.json({ questionPools })
        }

        const questionPools = await loadQuestionPoolSummariesServer()
        return NextResponse.json({ questionPools })
    } catch (error) {
        console.error('Error loading question pools:', error)
        return NextResponse.json(
            { error: 'Failed to load question pools' },
            { status: 500 }
        )
    }
}
