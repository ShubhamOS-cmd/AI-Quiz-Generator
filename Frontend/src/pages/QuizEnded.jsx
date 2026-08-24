import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { BarChart3, Clock, Home } from 'lucide-react';

export default function QuizEnded() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full glass-panel rounded-3xl border border-slate-800 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5">
                    <Clock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-extrabold text-white">Quiz Ended</h1>
                <p className="text-sm text-slate-400 mt-2">
                    The time for this quiz has expired. Your submitted answers have been recorded.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                    <button
                        type="button"
                        onClick={() => navigate(`/leaderboard/${quizId}`)}
                        className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4" />
                        View Leaderboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
