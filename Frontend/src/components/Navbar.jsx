import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { authApi } from '../services/api';
import { disconnectSocket } from '../services/socket';
import { ClipboardCheck, Trophy, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout API error:", e);
    } finally {
      disconnectSocket();
      dispatch(logout());
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-600 group-hover:border-blue-300/60 transition-colors">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Quiz<span className="text-blue-600">AI</span>
            </span>
            <span className="text-[11px] text-slate-400 -mt-1 hidden sm:inline">Assessment workspace</span>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/')
                  ? 'bg-blue-500/15 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              to="/create"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/create')
                  ? 'bg-blue-500/15 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              AI Studio
            </Link>

            <Link
              to="/leaderboard/search"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/leaderboard/search') || location.pathname.startsWith('/leaderboard')
                  ? 'bg-blue-500/15 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboards
            </Link>
          </nav>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                <div className="w-7 h-7 rounded-md bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-blue-600 uppercase">
                  {user?.username?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">{user?.username}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 text-xs font-medium transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
