'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExamConfig, QuestionPool } from '@/dto/question-dto';
import StatsModal from '@/components/StatsModal';
import { loadQuestionPools } from '@/utils/question-pool-loader';

export default function Home() {
  const router = useRouter();
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadQuestionPoolsData();
  }, []);

  const loadQuestionPoolsData = async () => {
    try {
      const pools = await loadQuestionPools();
      
      if (pools.length > 0) {
        setQuestionPools(pools);
        setSelectedPool(pools[0].filename);
        setQuestionCount(Math.min(10, pools[0].questions.length));
        setTimeLimit(15);
      } else {
        console.error('No question pools found');
      }
    } catch (error) {
      console.error('Error loading question pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!selectedPool || questionCount <= 0 || timeLimit <= 0) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const config: ExamConfig = {
      questionPool: selectedPool,
      questionCount,
      timeLimit
    };

    // Store config in sessionStorage for the exam session
    sessionStorage.setItem('examConfig', JSON.stringify(config));
    
    router.push('/exam');
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
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Hệ Thống Thi Thử
              </h1>
              <p className="text-gray-600 text-sm">
                Chọn cấu hình và bắt đầu bài thi của bạn
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Question Pool Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="text-lg">📚</span>
                  Chọn bộ câu hỏi
                </label>
                <div className="relative">
                  <select
                    value={selectedPool}
                    onChange={(e) => {
                      const newPool = e.target.value;
                      setSelectedPool(newPool);
                      const pool = questionPools.find(p => p.filename === newPool);
                      const poolSize = pool ? pool.questions.length : 0;
                      setQuestionCount(Math.min(10, poolSize));
                      setTimeLimit(15);
                    }}
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
                <p className="text-xs text-gray-500 mt-1">
                  Bộ đề hiện có: {questionPools.find(p => p.filename === selectedPool)?.questions.length || 0} câu hỏi
                </p>
              </div>

              {/* Question Count */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="text-lg">📝</span>
                  Số lượng câu hỏi
                </label>
                <input
                  type="number"
                  min="1"
                  max={questionPools.find(p => p.filename === selectedPool)?.questions.length || 0}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const max = questionPools.find(p => p.filename === selectedPool)?.questions.length || 0;
                    const clamped = Math.max(1, Math.min(max, val));
                    setQuestionCount(clamped);
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-800 placeholder-gray-500"
                  placeholder="Nhập số câu hỏi"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Tối đa: {questionPools.find(p => p.filename === selectedPool)?.questions.length || 0} câu
                </p>
              </div>

              {/* Time Limit */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="text-lg">⏰</span>
                  Thời gian làm bài (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-800 placeholder-gray-500"
                  placeholder="Nhập thời gian (phút)"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleStartExam}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    Bắt đầu thi
                  </span>
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStats(true)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>📊</span>
                      <span className="text-sm">Thống kê nhanh</span>
                    </span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/stats')}
                    className="flex-1 bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:via-violet-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>📈</span>
                      <span className="text-sm">Thống kê chi tiết</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="flex items-center gap-2 font-semibold text-blue-800 mb-3">
                <span>ℹ️</span>
                Thông tin
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Hệ thống sẽ ưu tiên các câu hỏi bạn chưa làm hoặc làm sai nhiều lần</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Kết quả sẽ được lưu tự động vào trình duyệt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Bài thi sẽ tự động nộp khi hết thời gian</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        questionPool={selectedPool}
      />
    </div>
  );
}