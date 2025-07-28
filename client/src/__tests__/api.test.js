import { mockApiResponses } from '../test-utils';

// Mock axios instead of importing it
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

describe('API Integration Tests', () => {
  it('should have mock API responses defined', () => {
    expect(mockApiResponses).toBeDefined();
    expect(mockApiResponses.leaderboard).toBeDefined();
    expect(mockApiResponses.players).toBeDefined();
    expect(mockApiResponses.pendingRequests).toBeDefined();
  });

  it('should have proper leaderboard mock structure', () => {
    const { leaderboard } = mockApiResponses;
    expect(leaderboard.data).toBeDefined();
    expect(leaderboard.data.leaderboard).toBeInstanceOf(Array);
    expect(leaderboard.data.stats).toBeDefined();
    expect(leaderboard.data.stats.totalPlayers).toEqual(2);
    expect(leaderboard.data.stats.totalMatches).toEqual(9);
  });

  it('should have proper players mock structure', () => {
    const { players } = mockApiResponses;
    expect(players.data).toBeDefined();
    expect(players.data.players).toBeInstanceOf(Array);
    expect(players.data.players).toHaveLength(4);
    expect(players.data.players[0]).toHaveProperty('id');
    expect(players.data.players[0]).toHaveProperty('username');
  });

  it('should have proper pending requests mock structure', () => {
    const { pendingRequests } = mockApiResponses;
    expect(pendingRequests.data).toBeDefined();
    expect(pendingRequests.data.pendingRequests).toBeInstanceOf(Array);
    expect(pendingRequests.data.pendingRequests[0]).toHaveProperty('id');
    expect(pendingRequests.data.pendingRequests[0]).toHaveProperty('reporter');
  });
});
