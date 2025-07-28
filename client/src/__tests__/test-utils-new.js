import React from 'react';
import { render } from '@testing-library/react';

// Simple render function for basic component testing
export { render };

// Mock user data for testing
export const mockUsers = {
  regularUser: {
    id: 2,
    username: 'alice',
    isAdmin: false,
  },
  adminUser: {
    id: 1,
    username: 'admin',
    isAdmin: true,
  },
};

// Mock API responses
export const mockApiResponses = {
  leaderboard: {
    data: {
      leaderboard: [
        { username: 'admin', elo: 1500, matches: 10, wins: 6 },
        { username: 'alice', elo: 1250, matches: 4, wins: 2 },
      ],
      stats: {
        totalPlayers: 2,
        totalMatches: 9,
        highestElo: 1500,
        averageElo: 1375,
      },
    },
  },
  players: {
    data: {
      players: [
        { id: 1, username: 'admin' },
        { id: 3, username: 'bob' },
        { id: 4, username: 'charlie' },
        { id: 5, username: 'daniel' },
      ],
    },
  },
  pendingRequests: {
    data: {
      pendingRequests: [
        {
          id: 1,
          reporter: 'alice',
          score1: 2,
          score2: 1,
          createdAt: '2023-10-01T10:00:00Z',
        },
      ],
    },
  },
  stats: {
    data: {
      totalPlayers: 2,
      totalMatches: 9,
      highestElo: 1500,
      averageElo: 1375,
    },
  },
};

// Test utilities validation
describe('Test utilities', () => {
  it('should export render function', () => {
    expect(render).toBeDefined();
    expect(typeof render).toBe('function');
  });

  it('should have valid mock user data', () => {
    expect(mockUsers.regularUser).toHaveProperty('username', 'alice');
    expect(mockUsers.adminUser).toHaveProperty('username', 'admin');
    expect(mockUsers.adminUser.isAdmin).toBe(true);
    expect(mockUsers.regularUser.isAdmin).toBe(false);
  });

  it('should have valid mock API responses', () => {
    expect(mockApiResponses.leaderboard.data.leaderboard).toHaveLength(2);
    expect(mockApiResponses.players.data.players).toHaveLength(4);
    expect(mockApiResponses.pendingRequests.data.pendingRequests).toHaveLength(1);
    expect(mockApiResponses.stats.data).toHaveProperty('totalPlayers', 2);
  });
});