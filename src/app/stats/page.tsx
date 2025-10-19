'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionPool, QuestionStats } from '@/dto/question-dto';
import { loadQuestionPools } from '@/utils/question-pool-loader';
import { getQuestionStats, getOverallStats } from '@/utils/stats';

export default function StatsPage() {
  const router = useRouter();
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadQuestionPoolsData();
  }, []);

  const loadQuestionPoolsData = async () => {
    try {
      const pools = await loadQuestionPools();
      setQuestionPools(pools);
      if (pools.length > 0) {
        setSelectedPool(pools[0].filename);
      }
    } catch (error) {
      console.error('Error loading question pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePoolChange = async (poolFilename: string) => {
    setSelectedPool(poolFilename);
    setLoading(true);
    
    try {
      const questionStats = await getQuestionStats(poolFilename);
      setStats(questionStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const overallStats = getOverallStats(stats);

  if (loading && questionPools.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Thống Kê Chi Tiết
          </h1>
          <p className="text-gray-600">
            Xem thống kê chi tiết về hiệu suất học tập của bạn
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Quay lại trang chủ
          </button>
        </div>

        {/* Pool Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Chọn bộ câu hỏi để xem thống kê
          </h2>
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
        </div>

        {loading && selectedPool ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thống kê...</p>
          </div>
        ) : stats.length > 0 ? (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {overallStats.totalQuestions}
                </div>
                <div className="text-gray-600">Tổng câu hỏi</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {overallStats.attemptedQuestions}
                </div>
                <div className="text-gray-600">Đã làm</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {overallStats.totalAttempts}
                </div>
                <div className="text-gray-600">Tổng lần làm</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {overallStats.overallAccuracy}%
                </div>
                <div className="text-gray-600">Độ chính xác</div>
              </div>
            </div>

            {/* Toggle Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Chi tiết từng câu hỏi
                </h2>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showDetails 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </button>
              </div>
            </div>

            {/* Question Details */}
            {showDetails && (
              <div className="space-y-6">
                {stats.map((stat, index) => (
                  <div key={stat.question.id} className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Câu {stat.question.id}
                          </span>
                          {stat.totalAttempts > 0 && (
                            <>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                stat.score >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                Điểm: {stat.score}
                              </span>
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                {stat.accuracy}% đúng
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-800 text-lg leading-relaxed">
                          {stat.question.content}
                        </p>
                      </div>
                    </div>

                    {/* Answers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {stat.question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className={`p-4 rounded-xl border-2 ${
                            answer.correct
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              answer.correct
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              {String.fromCharCode(64 + answer.id)}
                            </span>
                            <span className={`${
                              answer.correct ? 'text-green-800' : 'text-gray-700'
                            }`}>
                              {answer.content}
                            </span>
                            {answer.correct && (
                              <span className="ml-auto text-green-600 font-bold">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {stat.totalAttempts}
                          </div>
                          <div className="text-gray-600 text-sm">Tổng lần làm</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {stat.countTrue}
                          </div>
                          <div className="text-gray-600 text-sm">Lần đúng</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {stat.countFalse}
                          </div>
                          <div className="text-gray-600 text-sm">Lần sai</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {stat.accuracy}%
                          </div>
                          <div className="text-gray-600 text-sm">Độ chính xác</div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {stat.question.reason && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-semibold text-blue-800 mb-2">Giải thích:</h4>
                        <p className="text-blue-700">{stat.question.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {!showDetails && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Tóm tắt nhanh
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {overallStats.worstQuestions.length}
                    </div>
                    <div className="text-gray-600 text-sm">Câu làm sai nhiều</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {overallStats.neverAttempted.length}
                    </div>
                    <div className="text-gray-600 text-sm">Câu chưa làm</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {overallStats.totalCorrect}
                    </div>
                    <div className="text-gray-600 text-sm">Tổng câu đúng</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : selectedPool ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có dữ liệu thống kê
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn chưa làm bài thi nào từ bộ câu hỏi này.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Bắt đầu thi ngay
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
