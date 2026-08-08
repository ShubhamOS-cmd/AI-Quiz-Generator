import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter , RouterProvider } from 'react-router'
import { Navigate } from 'react-router'

import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Store from "./store/index.js"
import './index.css'
import App from './App.jsx';
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import LiveQuiz from './pages/LiveQuiz';
import Leaderboard from './pages/Leaderboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <ProtectedRoute authentication={false}>
            <Login />
          </ProtectedRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <ProtectedRoute authentication={false}>
            <Register />
          </ProtectedRoute>
        ),
      },
      {
        path: 'create',
        element: (
          <ProtectedRoute>
            <CreateQuiz />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quiz/:quizId',
        element: (
          <ProtectedRoute>
            <LiveQuiz />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leaderboard/:quizId',
        element: (
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={Store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
)