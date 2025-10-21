import { UserAnswer } from '@/dto/question-dto';

const STORAGE_PREFIX = 'exam_results_';

export const saveUserAnswer = (questionPool: string, questionId: string, isCorrect: boolean) => {
    const key = `${STORAGE_PREFIX}${questionPool}`;
    const existingData = localStorage.getItem(key);
    let userAnswers: UserAnswer[] = existingData ? JSON.parse(existingData) : [];

    const existingAnswer = userAnswers.find(answer => String(answer.questionId) === questionId);

    if (existingAnswer) {
        if (isCorrect) {
            existingAnswer.countTrue++;
        } else {
            existingAnswer.countFalse++;
        }
    } else {
        userAnswers.push({
            questionId,
            countTrue: isCorrect ? 1 : 0,
            countFalse: isCorrect ? 0 : 1
        });
    }

    localStorage.setItem(key, JSON.stringify(userAnswers));
};

export const getUserAnswers = (questionPool: string): UserAnswer[] => {
    const key = `${STORAGE_PREFIX}${questionPool}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

export const getQuestionScore = (questionPool: string, questionId: string): number => {
    const userAnswers = getUserAnswers(questionPool);
    const answer = userAnswers.find(a => String(a.questionId) === questionId);

    if (!answer) return 0; // Chưa làm bao giờ

    return answer.countTrue - answer.countFalse;
};

export const clearUserAnswers = (questionPool: string) => {
    const key = `${STORAGE_PREFIX}${questionPool}`;
    localStorage.removeItem(key);
};
