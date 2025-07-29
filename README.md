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
- Node.js (v18+) - for local development
- Docker & Docker Compose - for containerized deployment

### Quick Start with Docker (Recommended)

The fastest way to get the application running:

```bash
# Clone the repository
git clone <repository-url>
cd scores

# Start the application in production mode
docker-compose up --build -d

# Or start in development mode with hot reloading
docker-compose --profile dev up --build -d
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api

### Docker Management Commands

```bash
# Start production services
docker-compose up --build -d

# Start development services
docker-compose --profile dev up --build -d

# Stop all services
docker-compose down
docker-compose --profile dev down

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Health check
curl http://localhost:5001/api/health

# Clean up (removes data!)
docker-compose down -v
```

For detailed Docker instructions, see [DOCKER.md](DOCKER.md).

For a quick reference of Docker Compose commands, see [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md).

### Local Development Setup

If you prefer to run without Docker:

```bash
# Install dependencies for both client and server
npm install

# Start development servers
npm run dev

# Or start individually:
# Terminal 1 - Start server
cd server && npm run dev

# Terminal 2 - Start client  
cd client && npm start
```

### Database Schema

#### Players
- `id`: Primary key
- `username`: Unique player identifier
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