const DEFAULT_CORRECT_WEIGHT = 1
const DEFAULT_INCORRECT_WEIGHT = 2

const parseWeight = (value: string | undefined, fallback: number): number => {
    if (!value) {
        return fallback
    }

    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

const resolveWeight = (
    keys: string[],
    fallback: number
): number => {
    for (const key of keys) {
        const envValue = process.env[key]
        const weight = parseWeight(envValue, Number.NaN)
        if (Number.isFinite(weight)) {
            return weight
        }
    }

    return fallback
}

const CORRECT_WEIGHT = resolveWeight(
    [
        'NEXT_PUBLIC_QUESTION_SCORE_WEIGHT_CORRECT',
        'QUESTION_SCORE_WEIGHT_CORRECT'
    ],
    DEFAULT_CORRECT_WEIGHT
)

const INCORRECT_WEIGHT = resolveWeight(
    [
        'NEXT_PUBLIC_QUESTION_SCORE_WEIGHT_INCORRECT',
        'QUESTION_SCORE_WEIGHT_INCORRECT'
    ],
    DEFAULT_INCORRECT_WEIGHT
)

export const getQuestionScoreWeights = () => ({
    correctWeight: CORRECT_WEIGHT,
    incorrectWeight: INCORRECT_WEIGHT
})

export const computeQuestionScore = (
    countTrue: number,
    countFalse: number
): number => {
    const { correctWeight, incorrectWeight } = getQuestionScoreWeights()
    return (countTrue * correctWeight) - (countFalse * incorrectWeight)
}
