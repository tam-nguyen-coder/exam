import { QuestionPool } from '@/dto/question-dto';
import { prisma } from '@/lib/prisma';

export const loadQuestionPools = async (): Promise<QuestionPool[]> => {
    try {
        // Load question pools from database
        const questionPools = await prisma.questionPool.findMany({
            include: {
                questions: {
                    include: {
                        answers: true
                    }
                }
            }
        });

        // Transform database data to match QuestionPool interface
        const pools: QuestionPool[] = questionPools.map(pool => ({
            name: pool.name,
            filename: pool.name,
            questions: pool.questions.map(question => ({
                id: question.id,
                content: question.content,
                answers: question.answers.map(answer => ({
                    id: answer.id,
                    content: answer.content,
                    correct: answer.isCorrect
                })),
                explanation: question.explanation || undefined
            }))
        }));

        return pools;
    } catch (error) {
        console.error('Error loading question pools from database:', error);
        return [];
    }
};

// Hàm để thêm bộ câu hỏi mới
export const addQuestionPool = (poolName: string) => {
    console.log(`To add new question pool: ${poolName}`);
    console.log('1. Add the JSON file to /public/question-pool/');
    console.log('2. Run the seeding script: npm run db:seed');
};
