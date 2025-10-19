export interface QuestionDto {
    id: number;
    content: string;
    answers: AnswerDto[];
    reason?: string;
}

export interface AnswerDto {
    id: number;
    content: string;
    correct: boolean;
}

export interface UserAnswer {
    questionId: number;
    countTrue: number;
    countFalse: number;
}

export interface ExamConfig {
    questionPool: string;
    questionCount: number;
    timeLimit: number; // in minutes
}

export interface ExamSession {
    config: ExamConfig;
    questions: QuestionDto[];
    userAnswers: { [questionId: number]: number[] }; // questionId -> selected answer IDs
    startTime: number;
    endTime?: number;
    isCompleted: boolean;
}

export interface QuestionPool {
    name: string;
    filename: string;
    questions: QuestionDto[];
}

export interface QuestionStats {
    question: QuestionDto;
    countTrue: number;
    countFalse: number;
    totalAttempts: number;
    accuracy: number; // percentage
    score: number; // countTrue - countFalse
}
