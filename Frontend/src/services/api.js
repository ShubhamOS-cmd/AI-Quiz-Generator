import axios from 'axios';

const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookie support (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if access token exists in localStorage or Redux
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to automatically try refresh token on 401 error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authApi = {
  requestOtp: (data) => api.post('/api/v1/auth/otp-request', data),
  verifyOtp: (data) => api.post('/api/v1/auth/otp-verify', data),
  register: (data) => api.post('/api/v1/auth/register', data),
  login: (data) => api.post('/api/v1/auth/login', data),
  changePassword: (data) => api.post('/api/v1/auth/change-password', data),
  logout: () => api.post('/api/v1/auth/logout'),
};

// Quiz Services
export const quizApi = {
  saveQuiz: (data) => api.post('/quiz/save-quiz', data),
  generateQuiz: (data) => api.post('/quiz/generate', data),
  getLeaderboard: (quizId, limit = 50) => api.get(`/quiz/leaderboard/${quizId}?limit=${limit}`),
  getMyScore: (quizId) => api.get(`/quiz/myScore/${quizId}`),
};

export default api;
