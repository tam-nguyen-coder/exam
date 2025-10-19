'use client';

import { useState, useEffect } from 'react';
import { getUserAnswers } from '@/utils/storage';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPool: string;
}

export default function StatsModal({ isOpen, onClose, questionPool }: StatsModalProps) {
  const [stats, setStats] = useState<{
    totalAttempts: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    questionStats: Array<{
      questionId: number;
      countTrue: number;
      countFalse: number;
      accuracy: number;
    }>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, questionPool]);

  const loadStats = () => {
    const userAnswers = getUserAnswers(questionPool);
    
    const totalAttempts = userAnswers.reduce((sum, answer) => sum + answer.countTrue + answer.countFalse, 0);
    const correctAnswers = userAnswers.reduce((sum, answer) => sum + answer.countTrue, 0);
    const incorrectAnswers = userAnswers.reduce((sum, answer) => sum + answer.countFalse, 0);
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    const questionStats = userAnswers.map(answer => ({
      questionId: answer.questionId,
      countTrue: answer.countTrue,
      countFalse: answer.countFalse,
      accuracy: (answer.countTrue + answer.countFalse) > 0 
        ? Math.round((answer.countTrue / (answer.countTrue + answer.countFalse)) * 100)
        : 0
    })).sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (worst first)

    setStats({
      totalAttempts,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      questionStats
    });
  };

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Thống kê lịch sử thi
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl text-center border border-blue-200 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalAttempts}</div>
              <div className="text-sm text-blue-800 font-medium">Tổng lần thi</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl text-center border border-green-200 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.correctAnswers}</div>
              <div className="text-sm text-green-800 font-medium">Câu đúng</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl text-center border border-red-200 shadow-lg">
              <div className="text-3xl font-bold text-red-600 mb-1">{stats.incorrectAnswers}</div>
              <div className="text-sm text-red-800 font-medium">Câu sai</div>
            </div>
            <div className={`p-6 rounded-2xl text-center border shadow-lg ${
              stats.accuracy >= 80 ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 
              stats.accuracy >= 60 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            }`}>
              <div className={`text-3xl font-bold mb-1 ${
                stats.accuracy >= 80 ? 'text-green-600' : 
                stats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.accuracy}%
              </div>
              <div className="text-sm text-gray-800 font-medium">Độ chính xác</div>
            </div>
          </div>

          {/* Question-wise Stats */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Thống kê theo câu hỏi (sắp xếp từ khó nhất)
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {stats.questionStats.map((question, index) => (
                <div
                  key={question.questionId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {question.questionId}
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-3 py-1 rounded-lg font-medium border border-green-300">
                        ✓ {question.countTrue}
                      </span>
                      <span className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 px-3 py-1 rounded-lg font-medium border border-red-300">
                        ✗ {question.countFalse}
                      </span>
                    </div>
                  </div>
                  <div className={`text-lg font-bold px-3 py-1 rounded-lg ${
                    question.accuracy >= 80 ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300' : 
                    question.accuracy >= 60 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-300' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300'
                  }`}>
                    {question.accuracy}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2">
                <span>✓</span>
                Đóng
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
