import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from 'react-query';
import HomePage from '../pages/HomePage';
import { render, mockUsers, mockApiResponses } from './test-utils';
import * as api from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockedApi = api;

// Mock Ant Design components that might cause issues
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('HomePage', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it('should render leaderboard for unauthenticated users', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(<HomePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      });

      expect(screen.getByText('See the current rankings and join the competition')).toBeInTheDocument();
      expect(screen.queryByText('Pending Match Approvals')).not.toBeInTheDocument();
    });

    it('should display stats overview', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(<HomePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Players')).toBeInTheDocument();
        expect(screen.getByText('Matches')).toBeInTheDocument();
        expect(screen.getByText('Highest ELO')).toBeInTheDocument();
        expect(screen.getByText('Average ELO')).toBeInTheDocument();
      });

      expect(screen.getByText('2')).toBeInTheDocument(); // total players
      expect(screen.getByText('9')).toBeInTheDocument(); // total matches
    });

    it('should display leaderboard cards', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(<HomePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('alice')).toBeInTheDocument();
      });

      expect(screen.getByText('1500')).toBeInTheDocument(); // admin's ELO
      expect(screen.getByText('1250')).toBeInTheDocument(); // alice's ELO
      expect(screen.getByText('60% Win Rate')).toBeInTheDocument();
      expect(screen.getByText('50% Win Rate')).toBeInTheDocument();
    });
  });

  describe('authenticated user', () => {
    it('should render pending matches section for authenticated users', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);

      render(<HomePage />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByText('Pending Match Approvals')).toBeInTheDocument();
      });

      expect(screen.getByText('Check your pending matches and see how you rank against your colleagues')).toBeInTheDocument();
    });

    it('should display pending match requests', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);

      render(<HomePage />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('reported a match against you')).toBeInTheDocument();
        expect(screen.getByText('Score: 2 - 1')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deny/i })).toBeInTheDocument();
    });

    it('should show empty state when no pending matches', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue({ data: { pendingRequests: [] } });

      render(<HomePage />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByText('No pending match approvals')).toBeInTheDocument();
        expect(screen.getByText('All caught up! 🎉')).toBeInTheDocument();
      });
    });

    it('should highlight current user in leaderboard', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue({ data: { pendingRequests: [] } });

      render(<HomePage />, { 
        queryClient,
        user: mockUsers.regularUser // alice
      });

      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading spinner while fetching leaderboard', () => {
      mockedApi.publicAPI.getLeaderboard.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<HomePage />, { queryClient });

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('should handle leaderboard fetch errors gracefully', async () => {
      mockedApi.publicAPI.getLeaderboard.mockRejectedValue(new Error('Network error'));

      render(<HomePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      });

      // Should still render the page structure even with API errors
      expect(screen.getByText('Players')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should render all stats cards in appropriate grid layout', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(<HomePage />, { queryClient });

      await waitFor(() => {
        const statsCards = screen.getAllByRole('article') || screen.getAllByTestId('statistic-card');
        expect(statsCards.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
