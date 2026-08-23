import React from 'react';
import { Link } from 'react-router';
import { Play, Trophy, Clock, Calendar, CheckCircle2, Copy } from 'lucide-react';

export default function QuizCard({ quiz }) {
  const { _id, id, title, startTime, duration, status } = quiz;
  const quizId = _id || id;

  const copyQuizId = () => {
    navigator.clipboard.writeText(quizId);
    alert(`Quiz ID ${quizId} copied to clipboard!`);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            LIVE NOW
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            SCHEDULED
          </span>
        );
    }
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {getStatusBadge()}
          <button
            onClick={copyQuizId}
            className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800"
            title="Copy Quiz ID"
          >
            <Copy className="w-3 h-3" />
            <span className="font-mono">{String(quizId).slice(-6)}</span>
          </button>
        </div>

        <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">{title || 'Untitled Quiz'}</h4>

        <div className="space-y-1.5 text-xs text-slate-400 mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{startTime ? new Date(startTime).toLocaleString() : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>{duration} Minutes Duration</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
        {status === 'active' ? (
          <Link
            to={`/quiz/${quizId}`}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Join Arena
          </Link>
        ) : (
          <Link
            to={`/quiz/${quizId}`}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Enter Lobby
          </Link>
        )}

        <Link
          to={`/leaderboard/${quizId}`}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-semibold flex items-center justify-center"
          title="View Leaderboard"
        >
          <Trophy className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
