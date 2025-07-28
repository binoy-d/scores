import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockedApi = api;

describe('AuthContext', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  describe('initial state', () => {
    it('should start with null user and no loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should check for existing token on mount', () => {
      localStorage.setItem('token', 'existing-token');
      mockedApi.authAPI.getCurrentUser.mockResolvedValue({
        data: { id: 1, username: 'testuser' },
      });

      renderHook(() => useAuth(), { wrapper });

      expect(mockedApi.authAPI.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully and set user', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockedApi.authAPI.login.mockResolvedValue({
        data: { token: 'mock-token', user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(mockedApi.authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle login errors', async () => {
      mockedApi.authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout and clear user data', async () => {
      localStorage.setItem('token', 'existing-token');
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial user
      await act(async () => {
        result.current.setUser({ id: 1, username: 'testuser' });
      });

      await act(async () => {
        result.current.logout();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
    });
  });

  describe('utility functions', () => {
    it('should correctly identify authenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated()).toBe(false);

      act(() => {
        result.current.setUser({ id: 1, username: 'testuser' });
      });

      expect(result.current.isAuthenticated()).toBe(true);
    });

    it('should correctly identify admin users', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAdmin()).toBe(false);

      act(() => {
        result.current.setUser({ id: 1, username: 'admin', is_admin: true });
      });

      expect(result.current.isAdmin()).toBe(true);

      act(() => {
        result.current.setUser({ id: 2, username: 'user', is_admin: false });
      });

      expect(result.current.isAdmin()).toBe(false);
    });
  });
});
