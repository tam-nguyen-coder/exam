import { QuestionDto, QuestionStats } from '@/dto/question-dto'
import { getUserAnswers } from './storage'
import { loadQuestionPool } from './question-pool-loader'
import { computeQuestionScore } from './question-score'

export const getQuestionStats = async (questionPool: string): Promise<QuestionStats[]> => {
    try {
        // Load questions from the pool via API to preserve database IDs
        const pool = await loadQuestionPool(questionPool)

        if (!pool) {
            throw new Error(`Could not load question pool: ${questionPool}`)
        }

        const questions: QuestionDto[] = pool.questions
        const userAnswers = getUserAnswers(questionPool)

        const stats: QuestionStats[] = questions.map(question => {
            const userAnswer = userAnswers.find(ua => String(ua.questionId) === question.id)

            const countTrue = userAnswer?.countTrue || 0
            const countFalse = userAnswer?.countFalse || 0
            const totalAttempts = countTrue + countFalse
            const accuracy = totalAttempts > 0 ? Math.round((countTrue / totalAttempts) * 100) : 0
            const score = computeQuestionScore(countTrue, countFalse)

            return {
                question,
                countTrue,
                countFalse,
                totalAttempts,
                accuracy,
                score
            }
        })

        // Sort by score (worst first) then by total attempts
        return stats.sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score
            return b.totalAttempts - a.totalAttempts
        })

    } catch (error) {
        console.error('Error getting question stats:', error)
        return []
    }
}

export const getOverallStats = (stats: QuestionStats[]) => {
    const totalQuestions = stats.length
    const attemptedQuestions = stats.filter(s => s.totalAttempts > 0).length
    const totalAttempts = stats.reduce((sum, s) => sum + s.totalAttempts, 0)
    const totalCorrect = stats.reduce((sum, s) => sum + s.countTrue, 0)
    const totalIncorrect = stats.reduce((sum, s) => sum + s.countFalse, 0)
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

    // Find questions with worst performance
    const worstQuestions = stats
        .filter(s => s.totalAttempts > 0 && s.score < 0)
        .slice(0, 5)

    // Find questions never attempted
    const neverAttempted = stats.filter(s => s.totalAttempts === 0)

    return {
        totalQuestions,
        attemptedQuestions,
        totalAttempts,
        totalCorrect,
        totalIncorrect,
        overallAccuracy,
        worstQuestions,
        neverAttempted
    }
}
