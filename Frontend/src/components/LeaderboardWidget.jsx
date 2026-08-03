import React from 'react';
import { Trophy, Award, Medal, Crown, User } from 'lucide-react';

export default function LeaderboardWidget({ leaderboard = [], status = 'active' }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-slate-800">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
        <h4 className="text-base font-semibold text-slate-300">No Participant Scores Yet</h4>
        <p className="text-xs text-slate-500 mt-1">Be the first to attempt questions and claim the top rank!</p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      
      {/* Podium Cards for Top 3 */}
      <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2">
        {/* 2nd Place */}
        <div className="order-1 flex flex-col items-center">
          {top3[1] ? (
            <div className="w-full glass-card p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-300"></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-200 text-sm mb-1 shadow-md">
                2
              </div>
              <span className="font-semibold text-xs text-white truncate max-w-full">{top3[1].username}</span>
              <span className="text-xs font-extrabold text-slate-300 mt-0.5">{top3[1].score} pts</span>
            </div>
          ) : (
            <div className="w-full h-24 glass-card rounded-2xl border border-slate-800 opacity-40"></div>
          )}
        </div>

        {/* 1st Place */}
        <div className="order-2 flex flex-col items-center -mt-4">
          {top3[0] ? (
            <div className="w-full glass-card p-4 rounded-2xl border border-amber-500/50 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-amber-500/10 to-slate-900/60 shadow-xl shadow-amber-500/10">
              <Crown className="w-5 h-5 text-amber-400 mb-1 animate-bounce" />
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center mb-1 shadow-lg shadow-amber-500/30">
                1
              </div>
              <span className="font-bold text-sm text-white truncate max-w-full">{top3[0].username}</span>
              <span className="text-sm font-black text-amber-400 mt-0.5">{top3[0].score} pts</span>
            </div>
          ) : null}
        </div>

        {/* 3rd Place */}
        <div className="order-3 flex flex-col items-center">
          {top3[2] ? (
            <div className="w-full glass-card p-3 rounded-2xl border border-amber-700/60 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-700"></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 text-sm mb-1 shadow-md">
                3
              </div>
              <span className="font-semibold text-xs text-white truncate max-w-full">{top3[2].username}</span>
              <span className="text-xs font-extrabold text-amber-600 mt-0.5">{top3[2].score} pts</span>
            </div>
          ) : (
            <div className="w-full h-24 glass-card rounded-2xl border border-slate-800 opacity-40"></div>
          )}
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-12 text-center">Rank</span>
          <span className="flex-1">Participant</span>
          <span className="text-right">Score</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto">
          {leaderboard.map((item, idx) => {
            const rank = item.rank || idx + 1;
            const isTop3 = rank <= 3;
            
            return (
              <div
                key={item.userId || idx}
                className={`px-4 py-3 flex items-center justify-between transition-colors ${
                  rank === 1
                    ? 'bg-amber-500/10 font-medium'
                    : rank === 2
                    ? 'bg-slate-800/40'
                    : rank === 3
                    ? 'bg-amber-900/10'
                    : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="w-12 flex justify-center items-center font-bold text-sm">
                  {rank === 1 ? (
                    <Trophy className="w-4 h-4 text-amber-400" />
                  ) : rank === 2 ? (
                    <Medal className="w-4 h-4 text-slate-300" />
                  ) : rank === 3 ? (
                    <Award className="w-4 h-4 text-amber-600" />
                  ) : (
                    <span className="text-slate-400">#{rank}</span>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase shrink-0">
                    {item.username?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate">{item.username}</span>
                </div>

                <div className="text-right font-extrabold text-sm text-indigo-400">
                  {item.score} <span className="text-[10px] font-normal text-slate-500">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
