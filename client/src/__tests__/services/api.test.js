import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { authAPI, matchesAPI, publicAPI } from '../../services/api';

describe('API Services', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('authAPI', () => {
    describe('login', () => {
      it('should send login request with credentials', async () => {
        const mockResponse = { 
          data: { 
            token: 'test-token', 
            user: { id: 1, username: 'testuser' } 
          } 
        };
        
        mock.onPost('/api/auth/login').reply(200, mockResponse.data);

        const result = await authAPI.login('testuser', 'password');

        expect(mock.history.post).toHaveLength(1);
        expect(mock.history.post[0].url).toBe('/api/auth/login');
        expect(JSON.parse(mock.history.post[0].data)).toEqual({
          username: 'testuser',
          password: 'password'
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle login errors', async () => {
        mock.onPost('/api/auth/login').reply(401, { error: 'Invalid credentials' });

        await expect(authAPI.login('testuser', 'wrongpassword')).rejects.toThrow();
      });
    });

    describe('register', () => {
      it('should send registration request with user data', async () => {
        const mockResponse = { 
          data: { 
            token: 'test-token', 
            user: { id: 1, username: 'newuser' } 
          } 
        };
        
        mock.onPost('/api/auth/register').reply(201, mockResponse.data);

        const result = await authAPI.register('newuser', 'password');

        expect(mock.history.post).toHaveLength(1);
        expect(mock.history.post[0].url).toBe('/api/auth/register');
        expect(JSON.parse(mock.history.post[0].data)).toEqual({
          username: 'newuser',
          password: 'password'
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle registration errors', async () => {
        mock.onPost('/api/auth/register').reply(400, { error: 'Username already exists' });

        await expect(authAPI.register('existinguser', 'password')).rejects.toThrow();
      });
    });

    describe('getCurrentUser', () => {
      it('should fetch current user with token', async () => {
        localStorage.setItem('token', 'test-token');
        const mockResponse = { 
          data: { user: { id: 1, username: 'testuser' } } 
        };
        
        mock.onGet('/api/auth/me').reply(200, mockResponse.data);

        const result = await authAPI.getCurrentUser();

        expect(mock.history.get).toHaveLength(1);
        expect(mock.history.get[0].url).toBe('/api/auth/me');
        expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
        expect(result).toEqual(mockResponse);
      });

      it('should handle unauthorized requests', async () => {
        localStorage.setItem('token', 'invalid-token');
        mock.onGet('/api/auth/me').reply(401, { error: 'Unauthorized' });

        await expect(authAPI.getCurrentUser()).rejects.toThrow();
      });
    });
  });

  describe('matchesAPI', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    describe('createMatch', () => {
      it('should create match with provided data', async () => {
        const matchData = {
          opponents: ['user2'],
          yourScore: 2,
          opponentScore: 1
        };
        const mockResponse = { data: { success: true, matchId: 123 } };
        
        mock.onPost('/api/matches').reply(201, mockResponse.data);

        const result = await matchesAPI.createMatch(matchData);

        expect(mock.history.post).toHaveLength(1);
        expect(mock.history.post[0].url).toBe('/api/matches');
        expect(JSON.parse(mock.history.post[0].data)).toEqual(matchData);
        expect(mock.history.post[0].headers.Authorization).toBe('Bearer test-token');
        expect(result).toEqual(mockResponse);
      });

      it('should handle match creation errors', async () => {
        const matchData = { opponents: [], yourScore: 2, opponentScore: 1 };
        mock.onPost('/api/matches').reply(400, { error: 'Invalid match data' });

        await expect(matchesAPI.createMatch(matchData)).rejects.toThrow();
      });
    });

    describe('getPendingRequests', () => {
      it('should fetch pending match requests', async () => {
        const mockResponse = { 
          data: { 
            pendingRequests: [
              { id: 1, reporter: 'user2', score1: 2, score2: 1 }
            ] 
          } 
        };
        
        mock.onGet('/api/matches/pending').reply(200, mockResponse.data);

        const result = await matchesAPI.getPendingRequests();

        expect(mock.history.get).toHaveLength(1);
        expect(mock.history.get[0].url).toBe('/api/matches/pending');
        expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('approveMatch', () => {
      it('should approve match by ID', async () => {
        const mockResponse = { data: { success: true } };
        
        mock.onPost('/api/matches/123/approve').reply(200, mockResponse.data);

        const result = await matchesAPI.approveMatch(123);

        expect(mock.history.post).toHaveLength(1);
        expect(mock.history.post[0].url).toBe('/api/matches/123/approve');
        expect(mock.history.post[0].headers.Authorization).toBe('Bearer test-token');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('denyMatch', () => {
      it('should deny match by ID', async () => {
        const mockResponse = { data: { success: true } };
        
        mock.onPost('/api/matches/123/deny').reply(200, mockResponse.data);

        const result = await matchesAPI.denyMatch(123);

        expect(mock.history.post).toHaveLength(1);
        expect(mock.history.post[0].url).toBe('/api/matches/123/deny');
        expect(mock.history.post[0].headers.Authorization).toBe('Bearer test-token');
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('publicAPI', () => {
    describe('getLeaderboard', () => {
      it('should fetch leaderboard data', async () => {
        const mockResponse = { 
          data: { 
            leaderboard: [
              { username: 'user1', elo: 1500, matches: 10, wins: 6 },
              { username: 'user2', elo: 1400, matches: 8, wins: 3 }
            ],
            stats: {
              totalPlayers: 2,
              totalMatches: 9,
              highestElo: 1500,
              averageElo: 1450
            }
          } 
        };
        
        mock.onGet('/api/public/leaderboard').reply(200, mockResponse.data);

        const result = await publicAPI.getLeaderboard();

        expect(mock.history.get).toHaveLength(1);
        expect(mock.history.get[0].url).toBe('/api/public/leaderboard');
        expect(result).toEqual(mockResponse);
      });

      it('should handle leaderboard fetch errors', async () => {
        mock.onGet('/api/public/leaderboard').reply(500, { error: 'Server error' });

        await expect(publicAPI.getLeaderboard()).rejects.toThrow();
      });
    });

    describe('getPlayers', () => {
      it('should fetch all players', async () => {
        const mockResponse = { 
          data: { 
            players: [
              { id: 1, username: 'admin' },
              { id: 2, username: 'alice' },
              { id: 3, username: 'bob' }
            ]
          } 
        };
        
        mock.onGet('/api/public/players').reply(200, mockResponse.data);

        const result = await publicAPI.getPlayers();

        expect(mock.history.get).toHaveLength(1);
        expect(mock.history.get[0].url).toBe('/api/public/players');
        expect(result).toEqual(mockResponse);
      });

      it('should handle players fetch errors', async () => {
        mock.onGet('/api/public/players').reply(500, { error: 'Server error' });

        await expect(publicAPI.getPlayers()).rejects.toThrow();
      });
    });
  });

  describe('interceptors', () => {
    it('should automatically include auth token in requests', async () => {
      localStorage.setItem('token', 'test-token');
      mock.onGet('/api/auth/me').reply(200, { user: {} });

      await authAPI.getCurrentUser();

      expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
    });

    it('should handle requests without token', async () => {
      localStorage.removeItem('token');
      mock.onGet('/api/public/leaderboard').reply(200, { leaderboard: [] });

      await publicAPI.getLeaderboard();

      expect(mock.history.get[0].headers.Authorization).toBeUndefined();
    });

    it('should handle 401 responses by redirecting to login', async () => {
      localStorage.setItem('token', 'expired-token');
      mock.onGet('/api/auth/me').reply(401, { error: 'Token expired' });

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      try {
        await authAPI.getCurrentUser();
      } catch (error) {
        // Expected to throw
      }

      // Should remove token and redirect
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mock.onGet('/api/public/leaderboard').networkError();

      await expect(publicAPI.getLeaderboard()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/api/public/leaderboard').timeout();

      await expect(publicAPI.getLeaderboard()).rejects.toThrow();
    });

    it('should handle malformed response data', async () => {
      mock.onGet('/api/public/leaderboard').reply(200, 'invalid json');

      await expect(publicAPI.getLeaderboard()).rejects.toThrow();
    });
  });
});
