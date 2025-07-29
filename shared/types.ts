// Base entity interfaces
export interface BaseEntity {
  id: number;
  created_at: string;
}

// Player interfaces
export interface Player extends BaseEntity {
  username: string;
  elo_rating: number;
  is_admin?: boolean;
  password_hash?: string; // Only used server-side
}

export interface PlayerStats extends Player {
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  last_match_date: string | null;
  rank?: number;
}

// Match interfaces
export interface Match extends BaseEntity {
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id: number;
  status: 'pending' | 'confirmed' | 'denied';
  confirmed_at?: string | null;
  notes?: string;
}

export interface MatchWithPlayers extends Match {
  player1_username: string;
  player2_username: string;
  winner_username: string;
  player1_elo?: number;
  player2_elo?: number;
}

// Match request interfaces
export interface MatchRequest extends BaseEntity {
  match_id: number;
  requesting_player_id: number;
  confirming_player_id: number;
  status: 'pending' | 'confirmed' | 'denied';
}

export interface MatchRequestWithDetails extends MatchRequest {
  player1_username: string;
  player2_username: string;
  requesting_username: string;
  player1_score: number;
  player2_score: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface LeaderboardResponse {
  leaderboard: PlayerStats[];
  stats: {
    total_players: number;
    total_matches: number;
    highest_elo: number;
    lowest_elo: number;
    average_elo: number;
  };
  filters: {
    min_matches: number;
    limit: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Player;
}

export interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
  elo_rating: number;
}

// Form interfaces
export interface CreateMatchRequest {
  opponent_id: number;
  player_score: number;
  opponent_score: number;
  notes?: string;
}

export interface CreateUserRequest {
  username: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ELO calculation interfaces
export interface EloResult {
  oldRating: number;
  newRating: number;
  change: number;
}

export interface EloChanges {
  [playerId: string]: EloResult;
}

// Dashboard interfaces
export interface DashboardStats {
  pendingRequests: MatchRequestWithDetails[];
  recentMatches: MatchWithPlayers[];
  stats: {
    total_matches: number;
    wins: number;
    losses: number;
    winRate: string;
    elo_rating: number;
    username: string;
  };
}
