import { ReactNode } from 'react';

// Re-export shared types for convenience
export interface BaseEntity {
  id: number;
  created_at: string;
}

export interface Player extends BaseEntity {
  username: string;
  elo_rating: number;
  is_admin?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
  elo_rating: number;
}

// Context interfaces
export interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

// Component prop interfaces
export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface AdminRouteProps {
  children: ReactNode;
}

export interface AddMatchModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export interface NavbarProps {
  // Navbar doesn't need props currently
}

// API hook return types
export interface UsePlayersResult {
  data: Player[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseLeaderboardResult {
  data: any; // Will be properly typed with LeaderboardResponse
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Form data interfaces
export interface MatchFormData {
  opponent_id: number;
  playerScore: number;
  opponentScore: number;
  notes?: string;
}

export interface CreateMatchRequest {
  opponent_id: number;
  player_score: number;
  opponent_score: number;
  notes?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Table column interfaces for Ant Design
export interface PlayerColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (value: any, record: any) => ReactNode;
  sorter?: boolean | ((a: any, b: any) => number);
}

// Error interfaces
export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}
