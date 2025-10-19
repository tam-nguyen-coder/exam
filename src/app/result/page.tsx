'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExamSession, QuestionDto, AnswerDto } from '@/dto/question-dto';

interface QuestionResult {
  question: QuestionDto;
  userAnswers: number[];
  correctAnswers: number[];
  isCorrect: boolean;
  timeSpent?: number;
}

export default function ResultPage() {
  const router = useRouter();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    loadExamResults();
  }, []);

  const loadExamResults = () => {
    try {
      const resultsData = sessionStorage.getItem('examResults');
      if (!resultsData) {
        router.push('/');
        return;
      }

      const session: ExamSession = JSON.parse(resultsData);
      setExamSession(session);

      // Calculate results for each question
      const results: QuestionResult[] = session.questions.map(question => {
        const userAnswers = session.userAnswers[question.id] || [];
        const correctAnswers = question.answers
          .filter(answer => answer.correct)
          .map(answer => answer.id);
        
        const isCorrect = userAnswers.length === correctAnswers.length &&
          userAnswers.every(answerId => correctAnswers.includes(answerId));

        return {
          question,
          userAnswers,
          correctAnswers,
          isCorrect
        };
      });

      setQuestionResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam results:', error);
      router.push('/');
    }
  };

  const calculateScore = () => {
    const correctCount = questionResults.filter(result => result.isCorrect).length;
    const totalCount = questionResults.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    
    return { correctCount, totalCount, percentage };
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAnswerStatus = (answerId: number, questionResult: QuestionResult) => {
    const isUserSelected = questionResult.userAnswers.includes(answerId);
    const isCorrect = questionResult.correctAnswers.includes(answerId);
    
    if (isCorrect && isUserSelected) return 'correct-selected';
    if (isCorrect && !isUserSelected) return 'correct-not-selected';
    if (!isCorrect && isUserSelected) return 'incorrect-selected';
    return 'neutral';
  };

  const getAnswerStatusClass = (status: string) => {
    switch (status) {
      case 'correct-selected':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'correct-not-selected':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'incorrect-selected':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examSession || !questionResults.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy kết quả</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { correctCount, totalCount, percentage } = calculateScore();
  const timeSpent = examSession.endTime && examSession.startTime 
    ? examSession.endTime - examSession.startTime 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-4 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <span className="text-3xl">🎉</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Kết quả bài thi
              </h1>
              <p className="text-gray-600 mb-8">
                {examSession.config.questionPool} - {examSession.endTime ? new Date(examSession.endTime).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
              </p>

              {/* Score Display */}
              <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full ${getScoreBgColor(percentage)} mb-8 shadow-2xl`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(percentage)}`}>
                    {percentage}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {correctCount}/{totalCount}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{correctCount}</div>
                  <div className="text-sm text-blue-800 font-medium">Câu đúng</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-lg">
                  <div className="text-3xl font-bold text-red-600 mb-1">{totalCount - correctCount}</div>
                  <div className="text-sm text-red-800 font-medium">Câu sai</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {timeSpent ? formatTime(timeSpent) : 'N/A'}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Thời gian</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    {showAnswers ? 'Ẩn đáp án' : 'Xem lại'}
                  </span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    Thi lại
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {showAnswers && (
            <div className="space-y-6">
              {questionResults.map((result, index) => (
                <div
                  key={result.question.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 ${
                    result.isCorrect ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                        result.isCorrect 
                          ? 'bg-gradient-to-br from-green-500 to-green-600' 
                          : 'bg-gradient-to-br from-red-500 to-red-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                      result.isCorrect 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' 
                        : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                    }`}>
                      {result.isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 leading-relaxed mb-2">
                        {result.question.content}
                  </h3>

                  <div className="space-y-3">
                    {result.question.answers.map((answer) => {
                      const status = getAnswerStatus(answer.id, result);
                      return (
                        <div
                          key={answer.id}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${getAnswerStatusClass(status)}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg font-bold">
                              {status === 'correct-selected' && '✅'}
                              {status === 'correct-not-selected' && '✓'}
                              {status === 'incorrect-selected' && '❌'}
                              {status === 'neutral' && '○'}
                            </span>
                            <span className="font-medium">{answer.content}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {result.question.reason && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <span>💡</span>
                        Giải thích
                      </h4>
                      <p className="text-blue-700">{result.question.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}