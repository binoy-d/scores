import axios, { AxiosResponse } from 'axios';
import { 
  LoginFormData, 
  ChangePasswordRequest, 
  Player, 
  AuthUser,
  CreateMatchRequest
} from '../types';

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

// API Response interfaces
interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface ApiParams {
  [key: string]: any;
}

// Auth API functions
export const authAPI = {
  login: (credentials: LoginFormData): Promise<AxiosResponse<LoginResponse>> => 
    api.post('/auth/login', credentials),
  register: (userData: { username: string }): Promise<AxiosResponse<{ user: Player }>> => 
    api.post('/auth/register', userData),
  getCurrentUser: (): Promise<AxiosResponse<{ user: AuthUser }>> => 
    api.get('/auth/me'),
  refreshToken: (): Promise<AxiosResponse<{ token: string }>> => 
    api.post('/auth/refresh'),
  changePassword: (passwordData: ChangePasswordRequest): Promise<AxiosResponse<{ message: string }>> => 
    api.put('/auth/change-password', passwordData),
};

// Players API functions
export const playersAPI = {
  getAll: (params: ApiParams = {}): Promise<AxiosResponse<{ players: Player[] }>> => 
    api.get('/players', { params }),
  getById: (id: number): Promise<AxiosResponse<Player>> => 
    api.get(`/players/${id}`),
  create: (playerData: { username: string }): Promise<AxiosResponse<Player>> => 
    api.post('/players', playerData),
  update: (id: number, playerData: Partial<Player>): Promise<AxiosResponse<Player>> => 
    api.put(`/players/${id}`, playerData),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/players/${id}`),
  getDashboard: (id: number): Promise<AxiosResponse<any>> => 
    api.get(`/players/${id}/dashboard`),
};

// Matches API functions
export const matchesAPI = {
  getAll: (params: ApiParams = {}): Promise<AxiosResponse<any>> => 
    api.get('/matches', { params }),
  getById: (id: number): Promise<AxiosResponse<any>> => 
    api.get(`/matches/${id}`),
  create: (matchData: CreateMatchRequest): Promise<AxiosResponse<any>> => 
    api.post('/matches', matchData),
  confirm: (id: number, action: 'approve' | 'deny'): Promise<AxiosResponse<any>> => 
    api.put(`/matches/${id}/confirm`, { action }),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/matches/${id}`),
  getPendingRequests: (): Promise<AxiosResponse<any>> => 
    api.get('/matches/pending/requests'),
};

// Public API functions (no auth required)
export const publicAPI = {
  getLeaderboard: (params: ApiParams = {}): Promise<AxiosResponse<any>> => 
    api.get('/public/leaderboard', { params }),
  getRecentMatches: (params: ApiParams = {}): Promise<AxiosResponse<any>> => 
    api.get('/public/recent-matches', { params }),
  getPlayerProfile: (username: string): Promise<AxiosResponse<any>> => 
    api.get(`/public/player/${username}`),
  getPlayerEloHistory: (username: string): Promise<AxiosResponse<any>> => 
    api.get(`/public/player/${username}/elo-history`),
  getStats: (): Promise<AxiosResponse<any>> => 
    api.get('/public/stats'),
  getPlayers: (params: ApiParams = {}): Promise<AxiosResponse<{ players: Player[] }>> => 
    api.get('/public/players', { params }),
};

export default api;
