import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockUsers } from '../test-utils';

// Mock utility functions for testing
export const calculateWinRate = (wins, totalMatches) => {
  if (totalMatches === 0) return 0;
  return Math.round((wins / totalMatches) * 100);
};

export const formatUserName = (user) => {
  if (!user || !user.username) return 'Unknown User';
  return user.isAdmin ? `${user.username} (Admin)` : user.username;
};

export const isHighElo = (elo) => {
  return elo >= 1400;
};

// Simple component that uses these utilities
const UserDisplay = ({ user, wins, totalMatches }) => {
  const winRate = calculateWinRate(wins, totalMatches);
  const displayName = formatUserName(user);
  const isHigh = isHighElo(user?.elo || 0);

  return (
    <div data-testid="user-display">
      <span data-testid="user-name">{displayName}</span>
      <span data-testid="win-rate">{winRate}%</span>
      <span data-testid="elo-status">{isHigh ? 'High ELO' : 'Regular ELO'}</span>
    </div>
  );
};

describe('Utility Functions', () => {
  describe('calculateWinRate', () => {
    it('should calculate win rate correctly', () => {
      expect(calculateWinRate(6, 10)).toBe(60);
      expect(calculateWinRate(3, 4)).toBe(75);
      expect(calculateWinRate(0, 5)).toBe(0);
    });

    it('should handle zero total matches', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
      expect(calculateWinRate(5, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateWinRate(1, 3)).toBe(33); // 33.33... rounded to 33
      expect(calculateWinRate(2, 3)).toBe(67); // 66.66... rounded to 67
    });
  });

  describe('formatUserName', () => {
    it('should format regular user name', () => {
      expect(formatUserName(mockUsers.regularUser)).toBe('alice');
    });

    it('should format admin user name', () => {
      expect(formatUserName(mockUsers.adminUser)).toBe('admin (Admin)');
    });

    it('should handle null user', () => {
      expect(formatUserName(null)).toBe('Unknown User');
    });

    it('should handle user without username', () => {
      expect(formatUserName({})).toBe('Unknown User');
    });
  });

  describe('isHighElo', () => {
    it('should identify high ELO correctly', () => {
      expect(isHighElo(1500)).toBe(true);
      expect(isHighElo(1400)).toBe(true);
      expect(isHighElo(1399)).toBe(false);
      expect(isHighElo(1200)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isHighElo(0)).toBe(false);
      expect(isHighElo(-100)).toBe(false);
    });
  });
});

describe('UserDisplay Component', () => {
  it('should render user information correctly', () => {
    const user = { ...mockUsers.regularUser, elo: 1500 };
    render(<UserDisplay user={user} wins={6} totalMatches={10} />);

    expect(screen.getByTestId('user-name')).toHaveTextContent('alice');
    expect(screen.getByTestId('win-rate')).toHaveTextContent('60%');
    expect(screen.getByTestId('elo-status')).toHaveTextContent('High ELO');
  });

  it('should handle admin user', () => {
    const user = { ...mockUsers.adminUser, elo: 1200 };
    render(<UserDisplay user={user} wins={2} totalMatches={4} />);

    expect(screen.getByTestId('user-name')).toHaveTextContent('admin (Admin)');
    expect(screen.getByTestId('win-rate')).toHaveTextContent('50%');
    expect(screen.getByTestId('elo-status')).toHaveTextContent('Regular ELO');
  });

  it('should handle null user', () => {
    render(<UserDisplay user={null} wins={0} totalMatches={0} />);

    expect(screen.getByTestId('user-name')).toHaveTextContent('Unknown User');
    expect(screen.getByTestId('win-rate')).toHaveTextContent('0%');
    expect(screen.getByTestId('elo-status')).toHaveTextContent('Regular ELO');
  });
});
