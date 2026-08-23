import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import confetti from 'canvas-confetti';
import {
  initLiveQuiz,
  recordAttempt,
  updateLeaderboard,
  setCurrentQuestionIndex,
  setQuizCompleted,
  resetLiveQuizState,
} from '../store/quizSlice';
import { initSocket, getSocket, disconnectSocket } from '../services/socket';
import {
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  RefreshCw,
  Zap,
} from 'lucide-react';
import LeaderboardWidget from '../components/LeaderboardWidget';

export default function LiveQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { accessToken } = useSelector((state) => state.auth);
  const {
    liveQuestions,
    attemptedQuestions,
    userScore,
    leaderboard,
    quizStatus,
    currentQuestionIndex,
  } = useSelector((state) => state.quiz);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Initialize Socket and Join Room
  useEffect(() => {
    dispatch(resetLiveQuizState());
    setLoading(true);
    setError('');

    const socket = initSocket(accessToken);

    const handleRoomJoin = () => {
      socket.emit('join-room', quizId, (res) => {
        setLoading(false);
        if (!res || !res.success) {
          setError(res?.message || 'Quiz is not live right now or invalid Quiz ID.');
          return;
        }

        dispatch(
          initLiveQuiz({
            quizId,
            questions: res.questionWithResponse || [],
            leaderboard: res.leaderboard || [],
          })
        );
      });
    };

    if (socket.connected) {
      handleRoomJoin();
    } else {
      socket.on('connect', handleRoomJoin);
    }

    // Listen for live leaderboard updates from other participants
    socket.on('update', (top10Raw) => {
      // Format raw socket leaderboard array into [{ rank, username, score }]
      const formattedLeaderboard = [];
      if (Array.isArray(top10Raw)) {
        for (let i = 0; i < top10Raw.length; i += 2) {
          const rawMember = top10Raw[i];
          const score = Number(top10Raw[i + 1]);
          const username = typeof rawMember === 'string' && rawMember.includes(':')
            ? rawMember.split(':')[1]
            : rawMember;
          const userId = typeof rawMember === 'string' && rawMember.includes(':')
            ? rawMember.split(':')[0]
            : rawMember;

          formattedLeaderboard.push({
            rank: formattedLeaderboard.length + 1,
            userId,
            username,
            score,
          });
        }
      }
      dispatch(updateLeaderboard(formattedLeaderboard));
    });

    return () => {
      socket.off('update');
      socket.off('connect', handleRoomJoin);
    };
  }, [quizId, accessToken, dispatch]);

  const currentQ = liveQuestions[currentQuestionIndex];
  const currentQId = currentQ?._id || currentQ?.id;
  const currentAttempt = attemptedQuestions[currentQId];

  // Confetti trigger on completion
  useEffect(() => {
    if (quizStatus === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [quizStatus]);

  const handleOptionSelect = (optionText) => {
    if (currentAttempt || submitting) return; // Prevent re-attempt if already answered

    setSelectedOption(optionText);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('qAtempt', { questionId: currentQId, selectedOption: optionText }, (res) => {
      if (res && res.success) {
        const correctText = typeof currentQ.correctOption === 'string'
          ? currentQ.correctOption
          : currentQ.correctOption?.text;

        const isCorrect = optionText === correctText;
        const posScore = Number(currentQ.scoreOnCorrect) || 1;
        const negScore = Number(currentQ.scoreOnIncorrect) || 0;
        const delta = isCorrect ? posScore : -negScore;

        dispatch(
          recordAttempt({
            questionId: currentQId,
            selectedOption: optionText,
            isCorrect,
            scoreDelta: delta,
          })
        );
      } else {
        alert(res?.message || 'Question attempt failed.');
      }
    });
  };

  const handleSubmitQuiz = () => {
    const confirmSubmit = window.confirm('Are you sure you want to submit your quiz attempt?');
    if (!confirmSubmit) return;

    setSubmitting(true);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('submit', (res) => {
      setSubmitting(false);
      if (res && res.success) {
        dispatch(setQuizCompleted());
      } else {
        alert(res?.message || 'Submission failed.');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white">Connecting to Live Quiz Arena...</h3>
        <p className="text-xs text-slate-400 mt-1">Authenticating Socket.io handshake and fetching room state</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-3xl text-center border border-slate-800">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Room Error</h3>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Quiz Completed Result Screen
  if (quizStatus === 'completed') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        
        {/* Celebration Banner */}
        <div className="glass-panel rounded-3xl p-8 text-center border border-indigo-500/30 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Quiz Submission Complete!</h2>
          <p className="text-sm text-slate-400 mt-1">Great job! Here is your performance overview and attempted questions review.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Attempted Qs</span>
              <span className="text-xl font-black text-indigo-400">
                {Object.keys(attemptedQuestions).length} / {liveQuestions.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Score</span>
              <span className="text-xl font-black text-amber-400">{userScore} pts</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Status</span>
              <span className="text-xl font-black text-emerald-400">Submitted</span>
            </div>
          </div>
        </div>

        {/* Attempted Questions Detailed Breakdown (Requested by User) */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            Attempted Questions Review ({Object.keys(attemptedQuestions).length})
          </h3>

          <div className="space-y-4">
            {liveQuestions.map((q, idx) => {
              const qId = q._id || q.id;
              const attempt = attemptedQuestions[qId];
              const correctOptText = typeof q.correctOption === 'string' ? q.correctOption : q.correctOption?.text;

              return (
                <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-400">Question #{idx + 1}</span>
                    {attempt ? (
                      attempt.isCorrect ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.scoreOnCorrect || 1} pts)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-1 border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (-{q.scoreOnIncorrect || 0} pts)
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 text-xs">Unattempted</span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white">{q.questionText}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const optText = typeof opt === 'string' ? opt : opt.text;
                      const isSelected = attempt?.selectedOption === optText;
                      const isCorrect = optText === correctOptText;

                      let style = 'bg-slate-900/60 border-slate-800 text-slate-400';
                      if (isCorrect) style = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold';
                      else if (isSelected && !isCorrect) style = 'bg-red-500/10 border-red-500/40 text-red-300 font-semibold';

                      return (
                        <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}>
                          <span>{optText}</span>
                          {isSelected && <span className="text-[10px] font-bold uppercase">(Your Choice)</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 italic">
                      💡 Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    );
  }

  // Active Live Quiz Interface
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Quiz Arena</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">Quiz ID: <span className="font-mono text-indigo-300">{quizId}</span></h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Score: {userScore} pts</span>
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Main Grid: Question View & Live Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Question Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Question Stepper Navigator */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {liveQuestions.map((q, idx) => {
              const qId = q._id || q.id;
              const isAttempted = attemptedQuestions[qId];
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={idx}
                  onClick={() => dispatch(setCurrentQuestionIndex(idx))}
                  className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 scale-105'
                      : isAttempted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {currentQ && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 relative">
              
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                <span className="font-semibold text-indigo-400">
                  Question {currentQuestionIndex + 1} of {liveQuestions.length}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-medium">+{currentQ.scoreOnCorrect || 1} pts</span>
                  <span className="text-red-400 font-medium">-{currentQ.scoreOnIncorrect || 0} pts</span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQ.questionText}
              </h3>

              {/* Options Selection List */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const optText = typeof opt === 'string' ? opt : opt.text;
                  const isAnswered = !!currentAttempt;
                  const isSelected = currentAttempt?.selectedOption === optText || selectedOption === optText;
                  
                  let optionStyle = 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-200';
                  if (isSelected && isAnswered) {
                    optionStyle = currentAttempt.isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-red-500/15 border-red-500/80 text-red-300 shadow-md shadow-red-500/10';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => handleOptionSelect(optText)}
                      className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-center justify-between group ${optionStyle}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        {optText}
                      </span>

                      {isSelected && isAnswered && (
                        currentAttempt.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Attempt Feedback */}
              {currentAttempt && (
                <div className={`p-4 rounded-2xl text-xs font-medium border ${
                  currentAttempt.isCorrect 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {currentAttempt.isCorrect ? '✅ Correct Answer!' : '❌ Incorrect Attempt.'}
                  {currentQ.explanation && (
                    <p className="mt-1 text-slate-300 font-normal">💡 {currentQ.explanation}</p>
                  )}
                </div>
              )}

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={currentQuestionIndex === liveQuestions.length - 1}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-xs font-semibold text-white flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Live Socket Leaderboard Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              Live Socket Standings
            </h3>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              REALTIME
            </span>
          </div>

          <LeaderboardWidget leaderboard={leaderboard} status="active" />
        </div>

      </div>

    </div>
  );
}
