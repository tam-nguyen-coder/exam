import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface QuestionDto {
    id: number;
    content: string;
    answers: Array<{
        id: number;
        content: string;
        correct: boolean;
    }>;
    explanation?: string;
}

interface QuestionPoolData {
    name: string;
    questions: QuestionDto[];
}

// List of available question pools
const AVAILABLE_QUESTION_POOLS = [
    'scrum-master-1',
    'demo',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-01',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-02',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-03',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-04',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-05',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-06',
    'AWS-Certified-Solutions-Architect-Associate-SAA-C03-chunk-07',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-01',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-02',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-03',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-04',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-05',
    'AWS-Certified-Cloud-Practitioner-CLF-C02-chunk-06',
];

async function loadQuestionPoolFromFile(poolName: string): Promise<QuestionPoolData | null> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'question-pool', `${poolName}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        const questions = JSON.parse(content);

        return {
            name: poolName,
            questions
        };
    } catch (error) {
        console.warn(`Could not load question pool: ${poolName}`, error);
        return null;
    }
}

async function seedQuestionPool(poolData: QuestionPoolData) {
    console.log(`Seeding question pool: ${poolData.name}`);

    // Check if question pool already exists
    const existingPool = await prisma.questionPool.findUnique({
        where: { name: poolData.name }
    });

    if (existingPool) {
        console.log(`Question pool ${poolData.name} already exists, skipping...`);
        return;
    }

    // Create question pool
    const questionPool = await prisma.questionPool.create({
        data: {
            name: poolData.name,
            description: `Question pool: ${poolData.name}`
        }
    });

    console.log(`Created question pool: ${questionPool.id}`);

    // Create questions and answers
    for (const questionData of poolData.questions) {
        const question = await prisma.question.create({
            data: {
                questionPoolId: questionPool.id,
                content: questionData.content,
                explanation: questionData.explanation || null
            }
        });

        // Create answers for this question
        for (const answerData of questionData.answers) {
            await prisma.answer.create({
                data: {
                    questionId: question.id,
                    content: answerData.content,
                    isCorrect: answerData.correct
                }
            });
        }

        console.log(`Created question: ${question.id} with ${questionData.answers.length} answers`);
    }

    console.log(`Completed seeding ${poolData.name} with ${poolData.questions.length} questions`);
}

async function main() {
    console.log('Starting question pool seeding...');

    try {
        for (const poolName of AVAILABLE_QUESTION_POOLS) {
            const poolData = await loadQuestionPoolFromFile(poolName);
            if (poolData) {
                await seedQuestionPool(poolData);
            }
        }

        console.log('Question pool seeding completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
    main();
}

export { seedQuestionPool, loadQuestionPoolFromFile };
