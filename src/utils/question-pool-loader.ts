import { QuestionPool } from '@/dto/question-dto';

// Danh sách các file question pool có sẵn
// Bạn chỉ cần thêm tên file vào đây khi có bộ câu hỏi mới
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

export const loadQuestionPools = async (): Promise<QuestionPool[]> => {
    const pools: QuestionPool[] = [];

    // Detect server vs client
    const isServer = typeof window === 'undefined';

    for (const poolName of AVAILABLE_QUESTION_POOLS) {
        try {
            let questions: any[] | null = null;

            if (isServer) {
                // Server: read from filesystem under public/question-pool
                const fs = await import('fs/promises');
                const path = await import('path');
                const filePath = path.join(process.cwd(), 'public', 'question-pool', `${poolName}.json`);
                const content = await fs.readFile(filePath, 'utf-8');
                questions = JSON.parse(content);
            } else {
                // Client: fetch via relative path
                const response = await fetch(`/question-pool/${poolName}.json`);
                if (!response.ok) {
                    console.warn(`Could not load question pool: ${poolName}`);
                    continue;
                }
                questions = await response.json();
            }

            if (!questions) continue;

            pools.push({
                name: poolName,
                filename: poolName,
                questions
            });
        } catch (error) {
            console.warn(`Error loading question pool ${poolName}:`, error);
        }
    }

    return pools;
};

// Hàm để thêm bộ câu hỏi mới (chỉ cần thêm vào AVAILABLE_QUESTION_POOLS)
export const addQuestionPool = (poolName: string) => {
    // Trong thực tế, bạn sẽ thêm poolName vào AVAILABLE_QUESTION_POOLS
    console.log(`To add new question pool: ${poolName}`);
    console.log('1. Add the JSON file to /public/question-pool/');
    console.log('2. Add the pool name to AVAILABLE_QUESTION_POOLS array');
};
