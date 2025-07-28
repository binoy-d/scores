import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { render, mockUsers, mockApiResponses } from '../test-utils';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api;

// Mock react-router-dom to control navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
}));

describe('User Workflows - Integration Tests', () => {
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

  describe('Authentication Flow', () => {
    it('should complete full login workflow', async () => {
      const user = userEvent.setup();
      
      // Mock API responses
      mockedApi.authAPI.login.mockResolvedValue({
        data: { token: 'test-token', user: mockUsers.regularUser }
      });
      mockedApi.authAPI.getCurrentUser.mockResolvedValue({
        data: { user: mockUsers.regularUser }
      });
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Should show login form
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      // Fill out login form
      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Should redirect to dashboard and show user content
      await waitFor(() => {
        expect(screen.getByText('Pending Match Approvals')).toBeInTheDocument();
        expect(screen.getByText('alice')).toBeInTheDocument(); // username in navbar
      });

      // Verify API calls
      expect(mockedApi.authAPI.login).toHaveBeenCalledWith('alice', 'password');
      expect(mockedApi.matchesAPI.getPendingRequests).toHaveBeenCalled();
    });

    it('should handle login failure gracefully', async () => {
      const user = userEvent.setup();
      
      mockedApi.authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      await user.type(screen.getByLabelText(/username/i), 'alice');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Should still be on login page
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('should complete full logout workflow', async () => {
      const user = userEvent.setup();
      
      // Start logged in
      localStorage.setItem('token', 'test-token');
      mockedApi.authAPI.getCurrentUser.mockResolvedValue({
        data: { user: mockUsers.regularUser }
      });
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Should show authenticated state
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });

      // Click user menu and logout
      await user.click(screen.getByText('alice'));
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Logout'));

      // Should redirect to public view
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Pending Match Approvals')).not.toBeInTheDocument();
      });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Match Creation Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      mockedApi.authAPI.getCurrentUser.mockResolvedValue({
        data: { user: mockUsers.regularUser }
      });
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);
      mockedApi.publicAPI.getPlayers.mockResolvedValue(mockApiResponses.players);
    });

    it('should complete full match creation workflow', async () => {
      const user = userEvent.setup();
      
      mockedApi.matchesAPI.createMatch.mockResolvedValue({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add match/i })).toBeInTheDocument();
      });

      // Open add match modal
      await user.click(screen.getByRole('button', { name: /add match/i }));

      await waitFor(() => {
        expect(screen.getByText('Add Match Result')).toBeInTheDocument();
      });

      // Fill out match form
      const opponentSelect = screen.getByLabelText(/opponents/i);
      await user.click(opponentSelect);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      await user.type(screen.getByLabelText(/your score/i), '2');
      await user.type(screen.getByLabelText(/opponents? score/i), '1');

      // Submit match
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockedApi.matchesAPI.createMatch).toHaveBeenCalledWith({
          opponents: ['admin'],
          yourScore: 2,
          opponentScore: 1,
        });
      });

      // Modal should close and show success message
      await waitFor(() => {
        expect(screen.queryByText('Add Match Result')).not.toBeInTheDocument();
      });
    });

    it('should handle match creation validation errors', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add match/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add match/i }));

      await waitFor(() => {
        expect(screen.getByText('Add Match Result')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select opponents/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter your score/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter opponents? score/i)).toBeInTheDocument();
      });

      // Form should still be open
      expect(screen.getByText('Add Match Result')).toBeInTheDocument();
    });
  });

  describe('Match Approval Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      mockedApi.authAPI.getCurrentUser.mockResolvedValue({
        data: { user: mockUsers.regularUser }
      });
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);
    });

    it('should approve pending match', async () => {
      const user = userEvent.setup();
      
      mockedApi.matchesAPI.approveMatch.mockResolvedValue({ data: { success: true } });
      mockedApi.matchesAPI.getPendingRequests
        .mockResolvedValueOnce(mockApiResponses.pendingRequests)
        .mockResolvedValueOnce({ data: { pendingRequests: [] } }); // After approval

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Wait for pending matches to load
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('reported a match against you')).toBeInTheDocument();
      });

      // Approve the match
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockedApi.matchesAPI.approveMatch).toHaveBeenCalledWith(1);
      });

      // Should refresh pending requests and show empty state
      await waitFor(() => {
        expect(screen.getByText('No pending match approvals')).toBeInTheDocument();
        expect(screen.getByText('All caught up! 🎉')).toBeInTheDocument();
      });
    });

    it('should deny pending match', async () => {
      const user = userEvent.setup();
      
      mockedApi.matchesAPI.denyMatch.mockResolvedValue({ data: { success: true } });
      mockedApi.matchesAPI.getPendingRequests
        .mockResolvedValueOnce(mockApiResponses.pendingRequests)
        .mockResolvedValueOnce({ data: { pendingRequests: [] } }); // After denial

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('reported a match against you')).toBeInTheDocument();
      });

      // Deny the match
      const denyButton = screen.getByRole('button', { name: /deny/i });
      await user.click(denyButton);

      await waitFor(() => {
        expect(mockedApi.matchesAPI.denyMatch).toHaveBeenCalledWith(1);
      });

      // Should refresh and show empty state
      await waitFor(() => {
        expect(screen.getByText('No pending match approvals')).toBeInTheDocument();
      });
    });
  });

  describe('Public Leaderboard Workflow', () => {
    it('should display leaderboard for unauthenticated users', async () => {
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Should show public leaderboard
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('See the current rankings and join the competition')).toBeInTheDocument();
      });

      // Should show stats
      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(screen.getByText('Matches')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // total players
      expect(screen.getByText('9')).toBeInTheDocument(); // total matches

      // Should show leaderboard entries
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('1250')).toBeInTheDocument();

      // Should not show authenticated features
      expect(screen.queryByText('Pending Match Approvals')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add match/i })).not.toBeInTheDocument();
    });

    it('should navigate to login from public page', async () => {
      const user = userEvent.setup();
      
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      // Click login link
      await user.click(screen.getByText('Login'));

      // Should navigate to login page
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from API errors gracefully', async () => {
      // Start with failed API call
      mockedApi.publicAPI.getLeaderboard.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Should still render page structure despite API error
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      });

      // Subsequent API call should work
      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);

      // Trigger retry (this would typically be a user action like refresh)
      queryClient.invalidateQueries('leaderboard');

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
    });

    it('should handle token expiration during session', async () => {
      const user = userEvent.setup();
      
      // Start logged in
      localStorage.setItem('token', 'test-token');
      mockedApi.authAPI.getCurrentUser
        .mockResolvedValueOnce({ data: { user: mockUsers.regularUser } })
        .mockRejectedValueOnce({ response: { status: 401 } }); // Token expired

      mockedApi.publicAPI.getLeaderboard.mockResolvedValue(mockApiResponses.leaderboard);
      mockedApi.matchesAPI.getPendingRequests.mockResolvedValue(mockApiResponses.pendingRequests);

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>,
        { queryClient }
      );

      // Initially authenticated
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });

      // Simulate token expiration by triggering an API call
      queryClient.invalidateQueries();

      // Should redirect to public view
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Pending Match Approvals')).not.toBeInTheDocument();
      });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
