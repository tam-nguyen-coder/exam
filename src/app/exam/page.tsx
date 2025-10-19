'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ExamConfig, ExamSession, QuestionDto } from '@/dto/question-dto';
import { selectQuestions } from '@/utils/question-selection';
import { createTimer, formatTime, TimerState } from '@/utils/timer';
import { saveUserAnswer } from '@/utils/storage';
import { getCurrentTimestamp } from '@/utils/random';

export default function ExamPage() {
  const router = useRouter();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    isWarning: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeExam();
  }, []);

  const initializeExam = async () => {
    try {
      const configData = sessionStorage.getItem('examConfig');
      if (!configData) {
        router.push('/');
        return;
      }

      const config: ExamConfig = JSON.parse(configData);
      
      // Load questions from the selected pool
      const response = await fetch(`/question-pool/${config.questionPool}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load questions: ${response.statusText}`);
      }
      const allQuestions: QuestionDto[] = await response.json();
      
      // Select questions using the algorithm
      const selectedQuestions = selectQuestions(allQuestions, config.questionPool, config.questionCount);
      
      const session: ExamSession = {
        config,
        questions: selectedQuestions,
        userAnswers: {},
        startTime: getCurrentTimestamp(),
        isCompleted: false
      };

      setExamSession(session);
      setLoading(false);

      // Initialize timer
      const timer = createTimer(
        config.timeLimit,
        (state) => setTimerState(state),
        () => handleSubmitExam()
      );
      
      timer.start();
    } catch (error) {
      console.error('Error initializing exam:', error);
      router.push('/');
    }
  };

  const handleAnswerChange = (answerId: number, isChecked: boolean) => {
    if (!examSession) return;

    const currentQuestion = examSession.questions[currentQuestionIndex];
    const currentAnswers = examSession.userAnswers[currentQuestion.id] || [];

    let newAnswers;
    if (isChecked) {
      newAnswers = [...currentAnswers, answerId];
    } else {
      newAnswers = currentAnswers.filter(id => id !== answerId);
    }

    setExamSession({
      ...examSession,
      userAnswers: {
        ...examSession.userAnswers,
        [currentQuestion.id]: newAnswers
      }
    });
  };

  const handleSubmitExam = useCallback(() => {
    if (!examSession) return;

    // Calculate results and save to localStorage
    examSession.questions.forEach(question => {
      const userAnswers = examSession.userAnswers[question.id] || [];
      const correctAnswers = question.answers.filter(answer => answer.correct).map(answer => answer.id);
      
      // Check if user's answers match correct answers
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(answerId => correctAnswers.includes(answerId));
      
      saveUserAnswer(examSession.config.questionPool, question.id, isCorrect);
    });

    // Mark exam as completed
    const completedSession = {
      ...examSession,
      endTime: getCurrentTimestamp(),
      isCompleted: true
    };

    sessionStorage.setItem('examResults', JSON.stringify(completedSession));
    router.push('/result');
  }, [examSession, router]);

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const goToNextQuestion = () => {
    if (examSession && currentQuestionIndex < examSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getQuestionStatus = (questionId: number) => {
    if (!examSession) return 'unanswered';
    const answers = examSession.userAnswers[questionId];
    return answers && answers.length > 0 ? 'answered' : 'unanswered';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài thi</h2>
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

  const currentQuestion = examSession.questions[currentQuestionIndex];
  const userAnswers = examSession.userAnswers[currentQuestion.id] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Header with Timer */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Bài thi: {examSession.config.questionPool}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Câu {currentQuestionIndex + 1} / {examSession.questions.length}
              </p>
            </div>
            
            <div className={`text-3xl font-bold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg ${
              timerState.isWarning 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-red-200' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200'
            }`}>
              {formatTime(timerState.timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Danh sách câu hỏi
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-3 gap-3">
                {examSession.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`w-12 h-12 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-110 ${
                      index === currentQuestionIndex
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                        : getQuestionStatus(question.id) === 'answered'
                        ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 border-2 border-green-300 hover:from-green-200 hover:to-green-300'
                        : 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 border-2 border-red-300 hover:from-red-200 hover:to-red-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm mb-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Đã làm</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Chưa làm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 leading-relaxed">
                    {currentQuestion.content}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {currentQuestion.answers.map((answer) => (
                    <label
                      key={answer.id}
                      className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:from-blue-50 hover:to-white cursor-pointer transition-all duration-300 group"
                    >
                      <input
                        type="checkbox"
                        checked={userAnswers.includes(answer.id)}
                        onChange={(e) => handleAnswerChange(answer.id, e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-400 rounded focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-200">
                        {answer.content}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                >
                  <span className="flex items-center gap-2">
                    <span>←</span>
                    Câu trước
                  </span>
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitExam}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center gap-2">
                      <span>📝</span>
                      Nộp bài
                    </span>
                  </button>
                </div>

                <button
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === examSession.questions.length - 1}
                  className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                >
                  <span className="flex items-center gap-2">
                    Câu sau
                    <span>→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
