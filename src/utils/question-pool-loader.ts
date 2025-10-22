import { QuestionPool, QuestionPoolSummary } from '@/dto/question-dto'

type DbQuestionPool = {
    name: string
    questions: Array<{
        id: string
        content: string
        explanation: string | null
        answers: Array<{
            id: string
            content: string
            isCorrect: boolean
        }>
    }>
}

type DbQuestionPoolSummary = {
    name: string
    _count: {
        questions: number
    }
}

const transformQuestionPools = (pools: DbQuestionPool[]): QuestionPool[] =>
    pools.map(pool => ({
        name: pool.name,
        filename: pool.name,
        questions: pool.questions.map(question => ({
            id: String(question.id),
            content: question.content,
            answers: question.answers.map(answer => ({
                id: String(answer.id),
                content: answer.content,
                correct: answer.isCorrect
            })),
            explanation: question.explanation ?? undefined
        }))
    }))

const transformQuestionPoolSummaries = (pools: DbQuestionPoolSummary[]): QuestionPoolSummary[] =>
    pools.map(pool => ({
        name: pool.name,
        filename: pool.name,
        questionCount: pool._count.questions
    }))

const loadQuestionPoolsFromDb = async (): Promise<QuestionPool[]> => {
    try {
        const { prisma } = await import('@/lib/prisma')

        const questionPools = await prisma.questionPool.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                questions: {
                    include: {
                        answers: true
                    }
                }
            }
        })

        return transformQuestionPools(questionPools as unknown as DbQuestionPool[])
    } catch (error) {
        console.error('Error loading question pools from database:', error)
        throw error
    }
}

const loadQuestionPoolFromDb = async (poolName: string): Promise<QuestionPool | null> => {
    try {
        const { prisma } = await import('@/lib/prisma')

        const pool = await prisma.questionPool.findUnique({
            where: { name: poolName },
            include: {
                questions: {
                    include: {
                        answers: true
                    }
                }
            }
        })

        if (!pool) {
            return null
        }

        const [transformed] = transformQuestionPools([pool as unknown as DbQuestionPool])
        return transformed
    } catch (error) {
        console.error('Error loading question pool from database:', error)
        throw error
    }
}

const loadQuestionPoolSummariesFromDb = async (): Promise<QuestionPoolSummary[]> => {
    try {
        const { prisma } = await import('@/lib/prisma')

        const summaries = await prisma.questionPool.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        })

        return transformQuestionPoolSummaries(summaries as unknown as DbQuestionPoolSummary[])
    } catch (error) {
        console.error('Error loading question pool summaries from database:', error)
        throw error
    }
}

export const loadQuestionPoolSummaries = async (): Promise<QuestionPoolSummary[]> => {
    if (typeof window === 'undefined') {
        return loadQuestionPoolSummariesFromDb()
    }

    const response = await fetch('/api/question-pools', { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Failed to load question pool summaries')
    }

    const data = (await response.json()) as { questionPools?: QuestionPoolSummary[] }
    return data.questionPools ?? []
}

export const loadQuestionPool = async (poolName: string): Promise<QuestionPool | null> => {
    if (!poolName) {
        return null
    }

    if (typeof window === 'undefined') {
        return loadQuestionPoolFromDb(poolName)
    }

    const response = await fetch(`/api/question-pools/${encodeURIComponent(poolName)}`, {
        cache: 'no-store'
    })

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error('Failed to load question pool')
    }

    const data = (await response.json()) as { questionPool?: QuestionPool }
    return data.questionPool ?? null
}

export const loadQuestionPools = async (): Promise<QuestionPool[]> => {
    if (typeof window === 'undefined') {
        return loadQuestionPoolsFromDb()
    }

    const response = await fetch('/api/question-pools?detail=1', {
        cache: 'no-store'
    })

    if (!response.ok) {
        throw new Error('Failed to load question pools')
    }

    const data = (await response.json()) as { questionPools?: QuestionPool[] }
    return data.questionPools ?? []
}

export const loadQuestionPoolSummariesServer = loadQuestionPoolSummariesFromDb
export const loadQuestionPoolServer = loadQuestionPoolFromDb
export const loadQuestionPoolsServer = loadQuestionPoolsFromDb
