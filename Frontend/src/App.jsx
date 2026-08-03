import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import LiveQuiz from './pages/LiveQuiz';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:quizId"
            element={
              <ProtectedRoute>
                <LiveQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard/:quizId"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
