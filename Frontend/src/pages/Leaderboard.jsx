import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { quizApi } from '../services/api';
import { Trophy, Search, RefreshCw, AlertCircle, ArrowLeft, Award, UserCheck } from 'lucide-react';
import LeaderboardWidget from '../components/LeaderboardWidget';

export default function Leaderboard() {
  const { quizId: paramQuizId } = useParams();
  const navigate = useNavigate();

  const [inputQuizId, setInputQuizId] = useState(paramQuizId && paramQuizId !== 'search' ? paramQuizId : '');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizStatus, setQuizStatus] = useState('');
  const [myScore, setMyScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async (targetId) => {
    if (!targetId || targetId === 'search') return;

    setLoading(true);
    setError('');

    try {
      const res = await quizApi.getLeaderboard(targetId);
      const data = res.data?.data;
      setLeaderboardData(data?.leaderboard || []);
      setQuizStatus(data?.status || 'active');

      // Fetch user's score if available
      try {
        const scoreRes = await quizApi.getMyScore(targetId);
        setMyScore(scoreRes.data?.data || null);
      } catch (scoreErr) {
        setMyScore(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Quiz leaderboard not found.');
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramQuizId && paramQuizId !== 'search') {
      fetchLeaderboard(paramQuizId);
    }
  }, [paramQuizId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputQuizId.trim()) {
      navigate(`/leaderboard/${inputQuizId.trim()}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            Quiz Leaderboards
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Quiz ID..."
              value={inputQuizId}
              onChange={(e) => setInputQuizId(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* User Score Banner if available */}
      {myScore && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Your Quiz Performance</h4>
              <p className="text-xs text-slate-400">Recorded score and current ranking</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rank</span>
              <span className="text-lg font-black text-amber-400">#{myScore.rank}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score</span>
              <span className="text-lg font-black text-indigo-400">{myScore.score} pts</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <span>Fetching leaderboard rankings...</span>
        </div>
      ) : error ? (
        <div className="p-6 glass-panel rounded-2xl text-center border border-slate-800 text-red-400 text-sm">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <span>{error}</span>
        </div>
      ) : (
        paramQuizId && paramQuizId !== 'search' && (
          <LeaderboardWidget leaderboard={leaderboardData} status={quizStatus} />
        )
      )}

    </div>
  );
}
