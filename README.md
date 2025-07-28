# SVIC Scores

A comprehensive scoring system for tracking games played at SVIC. Currently supports ping pong with plans to expand to pickleball (with team support).

## Features

### Core Functionality
- **ELO Rating System**: Dynamic player rankings based on match results
- **Match Verification**: Two-player confirmation system to ensure accurate results
- **Admin Management**: Admins can create and manage players
- **Player Dashboards**: Personalized interfaces for match creation and approval
- **Public Leaderboard**: Accessible rankings and match history

### How It Works
1. **Player Management**: Admins can create and manage player accounts
2. **Match Creation**: Players log match results against other players
3. **Match Approval**: Opponents receive requests to confirm/deny match results
4. **ELO Calculation**: Confirmed matches update both players' ELO ratings
5. **Public Display**: Rankings and match history are publicly accessible

## Tech Stack

- **Frontend**: React with modern hooks and context
- **Backend**: Express.js REST API
- **Database**: SQLite for lightweight, embedded storage
- **Deployment**: Docker containerization
- **Authentication**: JWT-based session management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│  SQLite DB      │
│                 │    │                 │    │                 │
│ - Public Board  │    │ - Auth Routes   │    │ - Players       │
│ - Player Dash   │    │ - Match Routes  │    │ - Matches       │
│ - Admin Panel   │    │ - Player Routes │    │ - Match Requests│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker (optional, for containerized deployment)

### Development Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run in Docker
docker-compose up --build
```

### Database Schema

#### Players
- `id`: Primary key
- `username`: Unique player identifier
- `email`: Contact information
- `elo_rating`: Current ELO score (starts at 1200)
- `created_at`: Registration timestamp
- `is_admin`: Admin privileges flag

#### Matches
- `id`: Primary key
- `player1_id`: First player reference
- `player2_id`: Second player reference
- `player1_score`: Player 1's score
- `player2_score`: Player 2's score
- `winner_id`: Match winner reference
- `created_at`: Match creation time
- `confirmed_at`: Match confirmation time
- `status`: 'pending', 'confirmed', 'disputed'

#### Match Requests
- `id`: Primary key
- `match_id`: Associated match reference
- `requesting_player_id`: Player who created the match
- `confirming_player_id`: Player who needs to confirm
- `status`: 'pending', 'approved', 'denied'
- `created_at`: Request timestamp

## Future Enhancements

- **Pickleball Support**: Team-based matches and rankings
- **Tournament Mode**: Bracket-style competitions
- **Statistics Dashboard**: Detailed player analytics
- **Mobile App**: Native mobile application
- **Real-time Updates**: WebSocket-based live updates