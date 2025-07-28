import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from 'react-query';
import AddMatchModal from '../../components/AddMatchModal';
import { render, mockUsers, mockApiResponses } from '../test-utils';
import * as api from '../../services/api';
import { message } from 'antd';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api;

// Mock Ant Design message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AddMatchModal', () => {
  let queryClient;
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    isVisible: true,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    
    // Mock players API call
    mockedApi.publicAPI.getPlayers.mockResolvedValue(mockApiResponses.players);
  });

  describe('modal visibility', () => {
    it('should render modal when visible', async () => {
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByText('Add Match Result')).toBeInTheDocument();
      });
    });

    it('should not render modal when not visible', () => {
      render(<AddMatchModal {...defaultProps} isVisible={false} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      expect(screen.queryByText('Add Match Result')).not.toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render all required form fields', async () => {
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/your score/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/opponents? score/i)).toBeInTheDocument();
      });
    });

    it('should load and display players in opponent select', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      // Click to open the select dropdown
      const selectField = screen.getByLabelText(/opponents/i);
      await user.click(selectField);

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('charlie')).toBeInTheDocument();
        expect(screen.getByText('daniel')).toBeInTheDocument();
      });

      // Current user (alice) should not be in the list
      expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });

    it('should filter players based on search input', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      const selectField = screen.getByLabelText(/opponents/i);
      await user.click(selectField);

      // Type to filter
      await user.type(selectField, 'adm');

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.queryByText('bob')).not.toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please select opponents/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter your score/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter opponents? score/i)).toBeInTheDocument();
      });
    });

    it('should validate score inputs are numbers', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/your score/i)).toBeInTheDocument();
      });

      const yourScoreInput = screen.getByLabelText(/your score/i);
      await user.type(yourScoreInput, 'abc');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid number/i)).toBeInTheDocument();
      });
    });

    it('should validate that scores are non-negative', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/your score/i)).toBeInTheDocument();
      });

      const yourScoreInput = screen.getByLabelText(/your score/i);
      await user.clear(yourScoreInput);
      await user.type(yourScoreInput, '-1');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/score must be 0 or greater/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      mockedApi.matchesAPI.createMatch.mockResolvedValue({ data: { success: true } });
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      // Select opponent
      const opponentSelect = screen.getByLabelText(/opponents/i);
      await user.click(opponentSelect);
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));

      // Fill in scores
      const yourScore = screen.getByLabelText(/your score/i);
      const opponentScore = screen.getByLabelText(/opponents? score/i);
      
      await user.type(yourScore, '2');
      await user.type(opponentScore, '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.matchesAPI.createMatch).toHaveBeenCalledWith({
          opponents: ['admin'],
          yourScore: 2,
          opponentScore: 1,
        });
      });

      expect(mockOnSubmit).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith('Match reported successfully!');
    });

    it('should handle multiple opponents selection', async () => {
      const user = userEvent.setup();
      mockedApi.matchesAPI.createMatch.mockResolvedValue({ data: { success: true } });
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      // Select multiple opponents
      const opponentSelect = screen.getByLabelText(/opponents/i);
      await user.click(opponentSelect);
      
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      await user.click(screen.getByText('admin'));
      
      await user.click(screen.getByText('bob'));

      // Fill in scores
      await user.type(screen.getByLabelText(/your score/i), '3');
      await user.type(screen.getByLabelText(/opponents? score/i), '2');

      // Submit form
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockedApi.matchesAPI.createMatch).toHaveBeenCalledWith({
          opponents: ['admin', 'bob'],
          yourScore: 3,
          opponentScore: 2,
        });
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockedApi.matchesAPI.createMatch.mockRejectedValue(new Error('Server error'));
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      // Fill out form
      const opponentSelect = screen.getByLabelText(/opponents/i);
      await user.click(opponentSelect);
      await user.click(screen.getByText('admin'));
      
      await user.type(screen.getByLabelText(/your score/i), '2');
      await user.type(screen.getByLabelText(/opponents? score/i), '1');

      // Submit form
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Failed to report match. Please try again.');
      });
    });
  });

  describe('cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form when modal is cancelled', async () => {
      const user = userEvent.setup();
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      // Fill out some form data
      await waitFor(() => {
        expect(screen.getByLabelText(/your score/i)).toBeInTheDocument();
      });
      
      await user.type(screen.getByLabelText(/your score/i), '2');

      // Cancel and reopen
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Re-render with visible true to simulate reopening
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/your score/i)).toHaveValue('');
      });
    });
  });

  describe('loading states', () => {
    it('should show loading state while fetching players', () => {
      mockedApi.publicAPI.getPlayers.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      mockedApi.matchesAPI.createMatch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AddMatchModal {...defaultProps} />, { 
        queryClient,
        user: mockUsers.regularUser 
      });

      // Fill out form
      await waitFor(() => {
        expect(screen.getByLabelText(/opponents/i)).toBeInTheDocument();
      });

      const opponentSelect = screen.getByLabelText(/opponents/i);
      await user.click(opponentSelect);
      await user.click(screen.getByText('admin'));
      
      await user.type(screen.getByLabelText(/your score/i), '2');
      await user.type(screen.getByLabelText(/opponents? score/i), '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
