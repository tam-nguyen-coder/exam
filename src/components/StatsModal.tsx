'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { computeQuestionScore } from '@/utils/question-score';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPool: string;
}

interface StatsData {
  questionStats: Array<{
    questionId: string;
    countTrue: number;
    countFalse: number;
  }>;
  overallStats: {
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    accuracy: number;
    totalSessions: number;
  };
  sessions: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    createdAt: string;
  }>;
}

export default function StatsModal({ isOpen, onClose, questionPool }: StatsModalProps) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user && token && questionPool) {
      loadStats();
    }
  }, [isOpen, user, token, questionPool]);

  const loadStats = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/exam/stats?questionPool=${questionPool}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Thống kê nhanh</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.overallStats.totalSessions}</div>
                  <div className="text-sm text-blue-800">Lần thi</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.overallStats.totalCorrect}</div>
                  <div className="text-sm text-green-800">Câu đúng</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.overallStats.totalIncorrect}</div>
                  <div className="text-sm text-red-800">Câu sai</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className={`text-2xl font-bold ${getAccuracyColor(stats.overallStats.accuracy)}`}>
                    {stats.overallStats.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-800">Độ chính xác</div>
                </div>
              </div>

              {/* Recent Sessions */}
              {stats.sessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Lần thi gần đây</h3>
                  <div className="space-y-2">
                    {stats.sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">
                            {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getScoreColor(session.score, session.totalQuestions)}`}>
                            {session.score}/{session.totalQuestions}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round((session.score / session.totalQuestions) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Hiệu suất câu hỏi</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stats.questionStats
                    .sort((a, b) => {
                      const aScore = computeQuestionScore(a.countTrue, a.countFalse);
                      const bScore = computeQuestionScore(b.countTrue, b.countFalse);
                      return aScore - bScore; // Sort by worst performance first
                    })
                    .slice(0, 10)
                    .map((stat) => {
                      const totalAttempts = stat.countTrue + stat.countFalse;
                      const accuracy = totalAttempts > 0 ? (stat.countTrue / totalAttempts) * 100 : 0;
                      const score = computeQuestionScore(stat.countTrue, stat.countFalse);

                      return (
                        <div
                          key={stat.questionId}
                          className={`p-3 rounded-lg border-2 ${
                            score < 0
                              ? 'bg-red-50 border-red-200'
                              : score === 0
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                score < 0 ? 'bg-red-500' : score === 0 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}>
                                {stat.questionId}
                              </div>
                              <span className="text-sm text-gray-600">
                                Câu {stat.questionId}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">✓ {stat.countTrue}</span>
                              <span className="text-red-600">✗ {stat.countFalse}</span>
                              <span className={`font-medium ${getAccuracyColor(accuracy)}`}>
                                {accuracy.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Chưa có dữ liệu thống kê</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
