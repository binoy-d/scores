import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { render, mockUsers } from '../test-utils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

describe('Navbar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it('should render login and register links', () => {
      render(
        <MemoryRouter>
          <Navbar user={null} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });

    it('should highlight active navigation link', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Navbar user={null} logout={mockLogout} />
        </MemoryRouter>
      );

      const loginLink = screen.getByText('Login');
      expect(loginLink.closest('a')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('authenticated user', () => {
    it('should render user menu and dashboard link', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('alice')).toBeInTheDocument(); // username display
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should show user dropdown menu when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      // Click on user menu
      const userMenu = screen.getByText('alice');
      await user.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should call logout when logout is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      // Open user menu
      const userMenu = screen.getByText('alice');
      await user.click(userMenu);

      // Click logout
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
      
      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should highlight dashboard link when on dashboard', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('admin user', () => {
    it('should show admin menu items', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.adminUser} logout={mockLogout} />
        </MemoryRouter>
      );

      // Click on user menu
      const userMenu = screen.getByText('admin');
      await user.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
      });
    });

    it('should show admin badge or indicator', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.adminUser} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('admin')).toBeInTheDocument();
      // Check for admin indicator (could be badge, icon, or special styling)
      expect(screen.getByTestId('admin-badge') || screen.getByLabelText(/admin/i)).toBeInTheDocument();
    });
  });

  describe('navigation behavior', () => {
    it('should navigate to home when logo is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      const logo = screen.getByText('Scores') || screen.getByRole('link', { name: /home/i });
      await user.click(logo);

      // Should navigate to home (this would be tested with a navigation mock)
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });

    it('should show add match button for authenticated users', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /add match/i })).toBeInTheDocument();
    });

    it('should not show add match button for unauthenticated users', () => {
      render(
        <MemoryRouter>
          <Navbar user={null} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /add match/i })).not.toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should render mobile menu toggle button', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      // Look for mobile menu button (usually has bars icon)
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i }) || 
                              screen.getByTestId('mobile-menu-button');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /menu/i }) || 
                              screen.getByTestId('mobile-menu-button');
      
      await user.click(mobileMenuButton);

      // Mobile menu should be visible
      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu') || screen.getByRole('navigation')).toBeVisible();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/main navigation/i) || screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      // Tab through navigation elements
      await user.tab();
      expect(screen.getByText('Dashboard')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /add match/i })).toHaveFocus();
    });

    it('should announce current page to screen readers', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Navbar user={mockUsers.regularUser} logout={mockLogout} />
        </MemoryRouter>
      );

      const activeLink = screen.getByText('Dashboard');
      expect(activeLink.closest('a')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('error handling', () => {
    it('should handle missing user data gracefully', () => {
      render(
        <MemoryRouter>
          <Navbar user={{}} logout={mockLogout} />
        </MemoryRouter>
      );

      // Should render without crashing even with incomplete user data
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should handle missing logout function gracefully', () => {
      render(
        <MemoryRouter>
          <Navbar user={mockUsers.regularUser} logout={null} />
        </MemoryRouter>
      );

      // Should render without crashing
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });
});
