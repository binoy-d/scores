import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Players API functions
export const playersAPI = {
  getAll: (params = {}) => api.get('/players', { params }),
  getById: (id) => api.get(`/players/${id}`),
  create: (playerData) => api.post('/players', playerData),
  update: (id, playerData) => api.put(`/players/${id}`, playerData),
  delete: (id) => api.delete(`/players/${id}`),
  getDashboard: (id) => api.get(`/players/${id}/dashboard`),
};

// Matches API functions
export const matchesAPI = {
  getAll: (params = {}) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  create: (matchData) => api.post('/matches', matchData),
  confirm: (id, action) => api.put(`/matches/${id}/confirm`, { action }),
  delete: (id) => api.delete(`/matches/${id}`),
  getPendingRequests: () => api.get('/matches/pending/requests'),
};

// Public API functions (no auth required)
export const publicAPI = {
  getLeaderboard: (params = {}) => api.get('/public/leaderboard', { params }),
  getRecentMatches: (params = {}) => api.get('/public/recent-matches', { params }),
  getPlayerProfile: (username) => api.get(`/public/player/${username}`),
  getStats: () => api.get('/public/stats'),
  getPlayers: (params = {}) => api.get('/public/players', { params }),
};

export default api;
