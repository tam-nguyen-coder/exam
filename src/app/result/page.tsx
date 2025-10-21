'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionDto } from '@/dto/question-dto';
import { useAuth } from '@/contexts/AuthContext';

interface ExamSession {
  id: string;
  questionPool: string;
  questionCount: number;
  timeLimit: number;
  startTime: string;
  endTime: string;
  score: number;
  totalQuestions: number;
  answers: UserAnswer[];
}

interface UserAnswer {
  id: string;
  questionId: string;
  answerIds: string[];
  isCorrect: boolean;
}

interface QuestionResult {
  question: QuestionDto;
  userAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
}

export default function ResultPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }
    loadExamResults();
  }, [user, token, router]);

  const loadExamResults = async () => {
    try {
      const resultData = sessionStorage.getItem('examResult');
      if (!resultData) {
        router.push('/');
        return;
      }

      const session: ExamSession = JSON.parse(resultData);
      setExamSession(session);

      // Load questions from the pool
      const questionsResponse = await fetch(`/question-pool/${session.questionPool}.json`);
      if (!questionsResponse.ok) {
        throw new Error('Failed to load questions');
      }
      const rawQuestions = await questionsResponse.json();
      const allQuestions: QuestionDto[] = rawQuestions.map((question: any) => ({
        ...question,
        id: String(question.id),
        answers: question.answers.map((answer: any) => ({
          ...answer,
          id: String(answer.id)
        }))
      }));

      // Create question results
      const results: QuestionResult[] = session.answers.map(userAnswer => {
        const question = allQuestions.find(q => q.id === userAnswer.questionId);
        if (!question) return null;

        const correctAnswers = question.answers
          .filter(answer => answer.correct)
          .map(answer => answer.id);

        return {
          question,
          userAnswers: userAnswer.answerIds,
          correctAnswers,
          isCorrect: userAnswer.isCorrect
        };
      }).filter(Boolean) as QuestionResult[];

      setQuestionResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam results:', error);
      alert('Có lỗi xảy ra khi tải kết quả bài thi');
      router.push('/');
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'Xuất sắc! 🎉';
    if (percentage >= 80) return 'Tốt! 👍';
    if (percentage >= 70) return 'Khá! 👌';
    if (percentage >= 60) return 'Đạt! ✅';
    return 'Cần cải thiện! 📚';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examSession || questionResults.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy kết quả bài thi</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((examSession.score / examSession.totalQuestions) * 100);
  const timeSpent = new Date(examSession.endTime).getTime() - new Date(examSession.startTime).getTime();
  const minutesSpent = Math.round(timeSpent / 60000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Kết quả bài thi
          </h1>
          <p className="text-gray-600">
            Bộ đề: {examSession.questionPool}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(examSession.score, examSession.totalQuestions)}`}>
              {examSession.score}/{examSession.totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-gray-700 mb-2">
              {percentage}%
            </div>
            <div className="text-lg text-gray-600 mb-6">
              {getScoreMessage(examSession.score, examSession.totalQuestions)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="font-semibold text-blue-800">Thời gian làm bài</div>
                <div className="text-blue-600">{minutesSpent} phút</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="font-semibold text-green-800">Câu đúng</div>
                <div className="text-green-600">{examSession.score} câu</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="font-semibold text-red-800">Câu sai</div>
                <div className="text-red-600">{examSession.totalQuestions - examSession.score} câu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {showAnswers ? 'Ẩn đáp án' : 'Xem đáp án chi tiết'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Làm bài thi mới
          </button>
          <button
            onClick={() => router.push('/stats')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Xem thống kê
          </button>
        </div>

        {/* Detailed Answers */}
        {showAnswers && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Chi tiết đáp án</h2>
            <div className="space-y-6">
              {questionResults.map((result, index) => (
                <div
                  key={result.question.id}
                  className={`p-6 rounded-xl border-2 ${
                    result.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        {result.question.content}
                      </h3>
                      
                      <div className="space-y-2">
                        {result.question.answers.map((answer) => {
                          const isUserAnswer = result.userAnswers.includes(answer.id);
                          const isCorrectAnswer = result.correctAnswers.includes(answer.id);
                          
                          let answerClass = 'p-3 rounded-lg border-2 ';
                          if (isCorrectAnswer) {
                            answerClass += 'bg-green-100 border-green-300 text-green-800';
                          } else if (isUserAnswer && !isCorrectAnswer) {
                            answerClass += 'bg-red-100 border-red-300 text-red-800';
                          } else {
                            answerClass += 'bg-gray-50 border-gray-200 text-gray-700';
                          }
                          
                          return (
                            <div key={answer.id} className={answerClass}>
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && (
                                  <span className="text-green-600">✓</span>
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <span className="text-red-600">✗</span>
                                )}
                                <span>{answer.content}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
