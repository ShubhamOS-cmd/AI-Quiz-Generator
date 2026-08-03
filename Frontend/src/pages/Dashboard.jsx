import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sparkles, Play, Trophy, PlusCircle, ArrowRight, Zap, Flame, Shield, HelpCircle, KeyRound } from 'lucide-react';
import QuizCard from '../components/QuizCard';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [joinQuizId, setJoinQuizId] = useState('');
  const [searchLeaderboardId, setSearchLeaderboardId] = useState('');

  const navigate = useNavigate();

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinQuizId.trim()) {
      navigate(`/quiz/${joinQuizId.trim()}`);
    }
  };

  const handleLeaderboardSubmit = (e) => {
    e.preventDefault();
    if (searchLeaderboardId.trim()) {
      navigate(`/leaderboard/${searchLeaderboardId.trim()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 lg:p-10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Live Quiz Suite
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            Welcome back, <span className="text-gradient">{user?.username || 'Creator'}</span>! 👋
          </h1>
          <p className="text-base text-slate-300 mb-8 leading-relaxed">
            Generate instantly customizable quizzes using Groq Llama 3 AI, host real-time competitive arenas, and track live socket leaderboards with customizable scoring schemes.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/create"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              Create AI Quiz Studio
            </Link>
          </div>
        </div>
      </div>

      {/* Direct Action Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Join Live Quiz Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Play className="w-24 h-24 text-emerald-400" />
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Play className="w-6 h-6 fill-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Join Live Quiz Arena</h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter a 24-character Quiz ID provided by your instructor or host to enter the live room.
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Quiz ID (e.g. 660f...)"
                value={joinQuizId}
                onChange={(e) => setJoinQuizId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={!joinQuizId.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <span>Join Arena Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* AI Quiz Generator Launcher */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24 text-indigo-400" />
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">AI Quiz Studio</h3>
            <p className="text-xs text-slate-400 mb-6">
              Generate custom MCQs on any topic with custom positive/negative marking rules and instant scheduling.
            </p>
          </div>

          <Link
            to="/create"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch Generator</span>
          </Link>
        </div>

        {/* Search Leaderboard Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="w-24 h-24 text-amber-400" />
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Leaderboards & Rankings</h3>
            <p className="text-xs text-slate-400 mb-6">
              Look up live real-time scores or past finished standings for any active or completed quiz.
            </p>
          </div>

          <form onSubmit={handleLeaderboardSubmit} className="space-y-3">
            <div className="relative">
              <Trophy className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Quiz ID for Standings"
                value={searchLeaderboardId}
                onChange={(e) => setSearchLeaderboardId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={!searchLeaderboardId.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>View Standings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Feature Highlights Grid */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Flame className="w-5 h-5 text-indigo-400" />
          Key Features & Real-Time Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Groq Llama 3 AI Validation
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every topic is validated against gibberish before generating structured JSON questions with explanations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-bold text-purple-300 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Customizable Marking Scheme
            </div>
            <p className="text-slate-400 leading-relaxed">
              Configure positive points (+1, +2, +4) and negative penalties (0, -1) per question or globally.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Socket.io Live Synchronization
            </div>
            <p className="text-slate-400 leading-relaxed">
              Real-time socket rooms stream top-10 participant rankings instantly on every question attempt.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
