import { QuestionPool } from '@/dto/question-dto'

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

export const loadQuestionPools = async (): Promise<QuestionPool[]> => {
    // On the server we can load directly from the database
    if (typeof window === 'undefined') {
        return loadQuestionPoolsFromDb()
    }

    // In the browser we fetch through the API route
    const response = await fetch('/api/question-pools', { cache: 'no-store' })

    if (!response.ok) {
        throw new Error('Failed to load question pools')
    }

    const data = (await response.json()) as { questionPools?: QuestionPool[] }
    return data.questionPools ?? []
}

export const loadQuestionPoolsServer = loadQuestionPoolsFromDb
