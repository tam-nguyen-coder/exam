import { QuestionDto } from '@/dto/question-dto';
import { getQuestionScore } from './storage';
import { shuffleArray } from './random';

export const selectQuestions = (
    allQuestions: QuestionDto[],
    questionPool: string,
    count: number
): QuestionDto[] => {
    if (count >= allQuestions.length) {
        return [...allQuestions];
    }

    // Tạo danh sách câu hỏi với điểm ưu tiên
    const questionsWithPriority = allQuestions.map(question => ({
        question,
        priority: getQuestionScore(questionPool, question.id)
    }));

    // Sắp xếp theo độ ưu tiên (điểm thấp hơn = ưu tiên cao hơn)
    questionsWithPriority.sort((a, b) => a.priority - b.priority);

    // Lấy số lượng câu hỏi cần thiết
    const selectedQuestions = questionsWithPriority
        .slice(0, count)
        .map(item => item.question);

    // Trộn ngẫu nhiên để tránh thứ tự dự đoán được
    return shuffleArray(selectedQuestions);
};
