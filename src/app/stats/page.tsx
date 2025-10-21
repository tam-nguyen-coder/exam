'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionPool } from '@/dto/question-dto';
import { loadQuestionPools } from '@/utils/question-pool-loader';
import { useAuth } from '@/contexts/AuthContext';
import { computeQuestionScore } from '@/utils/question-score';

interface QuestionStats {
  questionId: string;
  countTrue: number;
  countFalse: number;
  lastAttemptedAt?: string;
}

interface OverallStats {
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  totalSessions: number;
}

interface ExamSession {
  id: string;
  questionPool: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

export default function StatsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }
    loadQuestionPoolsData();
  }, [user, token, router]);

  const loadQuestionPoolsData = async () => {
    try {
      const pools = await loadQuestionPools();
      setQuestionPools(pools);
      if (pools.length > 0) {
        setSelectedPool(pools[0].filename);
        await loadStats(pools[0].filename);
      }
    } catch (error) {
      console.error('Error loading question pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (poolFilename: string) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/exam/stats?questionPool=${poolFilename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionStats(data.questionStats);
        setOverallStats(data.overallStats);
        setSessions(data.sessions);
      } else {
        console.error('Failed to load stats');
        setQuestionStats([]);
        setOverallStats(null);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setQuestionStats([]);
      setOverallStats(null);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePoolChange = async (poolFilename: string) => {
    setSelectedPool(poolFilename);
    await loadStats(poolFilename);
  };

  const getQuestionContent = (questionId: string) => {
    const pool = questionPools.find(p => p.filename === selectedPool);
    if (!pool) return null;
    return pool.questions.find(q => q.id === questionId);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Thống kê chi tiết
          </h1>
          <p className="text-gray-600">
            Theo dõi tiến độ học tập của bạn
          </p>
        </div>

        {/* Pool Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chọn bộ câu hỏi</h2>
          <div className="relative">
            <select
              value={selectedPool}
              onChange={(e) => handlePoolChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 appearance-none cursor-pointer text-gray-800"
            >
              {questionPools.map((pool) => (
                <option key={pool.filename} value={pool.filename}>
                  {pool.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng lần thi</p>
                  <p className="text-2xl font-bold text-blue-600">{overallStats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng câu trả lời</p>
                  <p className="text-2xl font-bold text-green-600">{overallStats.totalAttempts}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Câu đúng</p>
                  <p className="text-2xl font-bold text-green-600">{overallStats.totalCorrect}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Độ chính xác</p>
                  <p className={`text-2xl font-bold ${getAccuracyColor(overallStats.accuracy)}`}>
                    {overallStats.accuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lần thi gần đây</h2>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.questionPool}
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

        {/* Question Details Toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {showDetails ? 'Ẩn chi tiết câu hỏi' : 'Xem chi tiết câu hỏi'}
          </button>
        </div>

        {/* Question Details */}
        {showDetails && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Chi tiết từng câu hỏi</h2>
            <div className="space-y-4">
              {questionStats.map((stat) => {
                const question = getQuestionContent(stat.questionId);
                if (!question) return null;

                const totalAttempts = stat.countTrue + stat.countFalse;
                const accuracy = totalAttempts > 0 ? (stat.countTrue / totalAttempts) * 100 : 0;
                      const score = computeQuestionScore(stat.countTrue, stat.countFalse);

                return (
                  <div
                    key={stat.questionId}
                    className={`p-6 rounded-xl border-2 ${
                      score < 0
                        ? 'bg-red-50 border-red-200'
                        : score === 0
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        score < 0 ? 'bg-red-500' : score === 0 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {stat.questionId}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-3">
                          {question.content}
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-medium text-gray-600">Tổng lần làm</div>
                            <div className="text-lg font-bold text-blue-600">{totalAttempts}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-medium text-gray-600">Đúng</div>
                            <div className="text-lg font-bold text-green-600">{stat.countTrue}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-medium text-gray-600">Sai</div>
                            <div className="text-lg font-bold text-red-600">{stat.countFalse}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="font-medium text-gray-600">Độ chính xác</div>
                            <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                              {accuracy.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {stat.lastAttemptedAt && (
                          <div className="mt-3 text-sm text-gray-600">
                            Lần cuối: {new Date(stat.lastAttemptedAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
