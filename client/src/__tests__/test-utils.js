import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../contexts/AuthContext';

// Create a custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    user = null,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = {}
) => {
  const AllProviders = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Mock user data
export const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    is_admin: true,
    elo_rating: 1500,
  },
  regularUser: {
    id: 2,
    username: 'alice',
    email: 'alice@example.com',
    is_admin: false,
    elo_rating: 1250,
  },
};

// Mock API responses
export const mockApiResponses = {
  leaderboard: {
    data: {
      leaderboard: [
        {
          id: 1,
          username: 'admin',
          elo_rating: 1500,
          total_matches: 5,
          wins: 3,
          losses: 2,
          win_rate: 60.0,
          rank: 1,
          last_match_date: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          username: 'alice',
          elo_rating: 1250,
          total_matches: 4,
          wins: 2,
          losses: 2,
          win_rate: 50.0,
          rank: 2,
          last_match_date: '2024-01-02T00:00:00.000Z',
        },
      ],
      stats: {
        total_players: 2,
        total_matches: 9,
        highest_elo: 1500,
        lowest_elo: 1250,
        average_elo: 1375,
      },
      filters: {
        min_matches: 3,
        limit: 50,
      },
    },
  },
  players: {
    data: {
      players: [
        { id: 1, username: 'admin', elo_rating: 1500, total_matches: 5 },
        { id: 2, username: 'alice', elo_rating: 1250, total_matches: 4 },
        { id: 3, username: 'bob', elo_rating: 1180, total_matches: 3 },
        { id: 4, username: 'charlie', elo_rating: 1320, total_matches: 2 },
      ],
    },
  },
  pendingRequests: {
    data: {
      pendingRequests: [
        {
          id: 1,
          match_id: 1,
          requesting_username: 'alice',
          player1_score: 2,
          player2_score: 1,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  },
  stats: {
    data: {
      overall: {
        total_players: 4,
        total_matches: 14,
        pending_matches: 1,
        highest_elo: 1500,
        lowest_elo: 1180,
        average_elo: 1312,
      },
    },
  },
};

// Helper to wait for async operations
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from RTL
export * from '@testing-library/react';
export { renderWithProviders as render };
