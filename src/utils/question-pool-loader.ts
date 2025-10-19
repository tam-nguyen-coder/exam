import { QuestionPool } from '@/dto/question-dto';

// Danh sách các file question pool có sẵn
// Bạn chỉ cần thêm tên file vào đây khi có bộ câu hỏi mới
const AVAILABLE_QUESTION_POOLS = [
    'scrum-master-1',
    'demo'
];

export const loadQuestionPools = async (): Promise<QuestionPool[]> => {
    const pools: QuestionPool[] = [];

    for (const poolName of AVAILABLE_QUESTION_POOLS) {
        try {
            const response = await fetch(`/question-pool/${poolName}.json`);
            if (!response.ok) {
                console.warn(`Could not load question pool: ${poolName}`);
                continue;
            }

            const questions = await response.json();

            // Tạo tên hiển thị từ tên file
            const displayName = generateDisplayName(poolName);

            pools.push({
                name: displayName,
                filename: poolName,
                questions
            });
        } catch (error) {
            console.warn(`Error loading question pool ${poolName}:`, error);
        }
    }

    return pools;
};

// Tạo tên hiển thị đẹp từ tên file
const generateDisplayName = (filename: string): string => {
    // Chuyển đổi tên file thành tên hiển thị
    const nameMap: { [key: string]: string } = {
        'scrum-master-1': 'Scrum Master Certification (Full)',
        'demo': 'Demo Questions (5 câu)',
        // Thêm mapping cho các bộ câu hỏi mới ở đây
    };

    return nameMap[filename] || filename
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Hàm để thêm bộ câu hỏi mới (chỉ cần thêm vào AVAILABLE_QUESTION_POOLS)
export const addQuestionPool = (poolName: string, displayName?: string) => {
    // Trong thực tế, bạn sẽ thêm poolName vào AVAILABLE_QUESTION_POOLS
    // và displayName vào nameMap trong generateDisplayName
    console.log(`To add new question pool: ${poolName}${displayName ? ` (${displayName})` : ''}`);
    console.log('1. Add the JSON file to /public/question-pool/');
    console.log('2. Add the pool name to AVAILABLE_QUESTION_POOLS array');
    console.log('3. Add display name mapping to generateDisplayName function');
};
