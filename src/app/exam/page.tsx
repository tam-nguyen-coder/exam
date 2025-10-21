'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionDto } from '@/dto/question-dto'
import { selectQuestions } from '@/utils/question-selection'
import { createTimer, formatTime, TimerState } from '@/utils/timer'
import { getCurrentTimestamp } from '@/utils/random'
import { useAuth } from '@/contexts/AuthContext'
import { loadQuestionPools } from '@/utils/question-pool-loader'

interface ExamSession {
  id: string;
  questionPool: string;
  questionCount: number;
  timeLimit: number;
  startTime: string;
  endTime?: string;
}

export default function ExamPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    isWarning: false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }
    initializeExam();
  }, [user, token, router]);

  const initializeExam = async () => {
    try {
      const sessionId = sessionStorage.getItem('examSessionId');
      if (!sessionId) {
        router.push('/');
        return;
      }

      // Get exam session from database
      const response = await fetch(`/api/exam/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load exam session');
      }

      const { session } = await response.json();
      setExamSession(session);

      // Load questions for the selected pool via API to use database IDs
      const questionPools = await loadQuestionPools()
      const pool = questionPools.find(p => p.filename === session.questionPool)

      if (!pool) {
        throw new Error('Failed to load question pool')
      }

      const allQuestions: QuestionDto[] = pool.questions
      
      // Select questions using the algorithm
      const selectedQuestions = selectQuestions(allQuestions, session.questionPool, session.questionCount);
      setQuestions(selectedQuestions);

      // Initialize timer
      const timer = createTimer(session.timeLimit, (state) => {
        setTimerState(state);
      }, () => {
        handleSubmitExam();
      });

      setTimerState(timer.getState());
      timer.start();

      setLoading(false);
    } catch (error) {
      console.error('Error initializing exam:', error);
      alert('Có lỗi xảy ra khi khởi tạo bài thi');
      router.push('/');
    }
  };

  const handleAnswerChange = useCallback((questionId: string, answerId: string, isSelected: boolean) => {
    setUserAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      let newAnswers;
      
      if (isSelected) {
        newAnswers = Array.from(new Set([...currentAnswers, answerId]));
      } else {
        newAnswers = currentAnswers.filter(id => id !== answerId);
      }
      
      return {
        ...prev,
        [questionId]: newAnswers
      };
    });
  }, []);

  const handleSubmitExam = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      if (!examSession) return;

      // Convert user answers to the format expected by the API
      const answers = Object.entries(userAnswers).map(([questionId, answerIds]) => ({
        questionId,
        answerIds
      }));

      const response = await fetch(`/api/exam/sessions/${examSession.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const { session } = await response.json();
        // Store result in sessionStorage for the result page
        sessionStorage.setItem('examResult', JSON.stringify(session));
        sessionStorage.removeItem('examSessionId');
        router.push('/result');
      } else {
        alert('Có lỗi xảy ra khi nộp bài thi');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Có lỗi xảy ra khi nộp bài thi');
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examSession || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài thi</h1>
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

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswers = userAnswers[currentQuestion.id] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Bài thi: {examSession.questionPool}</h1>
              <p className="text-sm text-gray-600">
                Câu {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            
            {/* Timer */}
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
              timerState.isWarning 
                ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                : 'bg-green-100 text-green-700 border-2 border-green-300'
            }`}>
              {formatTime(timerState.timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="font-semibold text-gray-800 mb-4">Danh sách câu hỏi</h3>
              <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = userAnswers[question.id] && userAnswers[question.id].length > 0;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-lg transform scale-110'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
                </button>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Câu {currentQuestionIndex + 1}: {currentQuestion.content}
                </h2>
                
                <div className="space-y-4">
                  {currentQuestion.answers.map((answer) => {
                    const isSelected = currentAnswers.includes(answer.id);
                    return (
                      <div
                        key={answer.id}
                        onClick={() => handleAnswerChange(currentQuestion.id, answer.id, !isSelected)}
                        className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 group ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-400 shadow-lg'
                            : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-blue-300 hover:from-blue-50 hover:to-white'
                        }`}
                      >
                        <span className={`font-medium transition-colors duration-200 ${
                          isSelected
                            ? 'text-blue-900'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`}>
                          {answer.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Câu trước
                </button>
                
                <button
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Câu tiếp theo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
