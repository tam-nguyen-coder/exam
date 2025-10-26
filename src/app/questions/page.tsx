'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionPoolSummary } from '@/dto/question-dto';
import { loadQuestionPoolSummaries } from '@/utils/question-pool-loader';

interface Question {
  id: string;
  content: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface QuestionsResponse {
  questions: Question[];
  pagination: PaginationInfo;
  pool: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questionPools, setQuestionPools] = useState<QuestionPoolSummary[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [poolInfo, setPoolInfo] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);
  const [showAnswers, setShowAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestionPoolsData();
  }, []);

  useEffect(() => {
    if (selectedPool) {
      loadQuestions(1);
    }
  }, [selectedPool, questionsPerPage]);

  const loadQuestionPoolsData = async () => {
    try {
      const pools = await loadQuestionPoolSummaries();
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

  const loadQuestions = async (page: number) => {
    if (!selectedPool) return;

    setQuestionsLoading(true);
    try {
      const response = await fetch(
        `/api/question-pools/${selectedPool}/questions?page=${page}&limit=${questionsPerPage}`
      );

      if (response.ok) {
        const data: QuestionsResponse = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
        setPoolInfo(data.pool);
        setCurrentPage(page);
      } else {
        console.error('Error loading questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handlePoolChange = (poolFilename: string) => {
    setSelectedPool(poolFilename);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    loadQuestions(page);
  };

  const handleQuestionsPerPageChange = (limit: number) => {
    setQuestionsPerPage(limit);
    setCurrentPage(1);
  };

  const toggleShowAnswers = (questionId: string) => {
    setShowAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Ngân Hàng Câu Hỏi
          </h1>
          <p className="text-gray-600">
            Xem toàn bộ câu hỏi và đáp án trong bộ đề
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Pool Selection */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chọn bộ câu hỏi
              </label>
              <select
                value={selectedPool}
                onChange={(e) => handlePoolChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 appearance-none cursor-pointer text-gray-800"
              >
                {questionPools.map((pool) => (
                  <option key={pool.filename} value={pool.filename}>
                    {pool.name} ({pool.questionCount} câu)
                  </option>
                ))}
              </select>
            </div>

            {/* Questions Per Page */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số câu mỗi trang
              </label>
              <select
                value={questionsPerPage}
                onChange={(e) => handleQuestionsPerPageChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 appearance-none cursor-pointer text-gray-800"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={20}>20 câu</option>
                <option value={50}>50 câu</option>
              </select>
            </div>

            {/* Back Button */}
            <div className="flex-1">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>←</span>
                  <span>Quay lại</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pool Info */}
        {poolInfo && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{poolInfo.name}</h2>
            {poolInfo.description && (
              <p className="text-gray-600">{poolInfo.description}</p>
            )}
            {pagination && (
              <p className="text-sm text-gray-500 mt-2">
                Tổng cộng: {pagination.totalQuestions} câu hỏi
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        {questions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800">
              <span className="text-lg">💡</span>
              <span className="text-sm font-medium">
                Click vào câu hỏi để hiện/ẩn đáp án đúng
              </span>
            </div>
          </div>
        )}

        {/* Questions */}
        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((question, index) => {
              const isShowingAnswers = showAnswers.has(question.id);
              
              return (
                <div
                  key={question.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
                  onClick={() => toggleShowAnswers(question.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(currentPage - 1) * questionsPerPage + index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {question.content}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {question.answers.map((answer) => {
                          const shouldShowCorrect = isShowingAnswers && answer.isCorrect;
                          
                          return (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                                shouldShowCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                    shouldShowCorrect ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                >
                                  {shouldShowCorrect ? '✓' : '○'}
                                </div>
                                <span>{answer.content}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedPool ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Không có câu hỏi
            </h3>
            <p className="text-gray-600">
              Bộ đề này chưa có câu hỏi nào
            </p>
          </div>
        ) : null}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
              </div>

              <div className="text-center mt-2 text-sm text-gray-600">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
