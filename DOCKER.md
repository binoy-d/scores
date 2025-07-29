# Docker Setup for SVIC Scores

This document explains how to run the SVIC Scores application using Docker containers.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)

## Quick Start

### Production Mode

Run the application in production mode:

```bash
# Build and start the application
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api

### Development Mode

Run the application in development mode with hot reloading:

```bash
# Build and start development services
docker-compose --profile dev up --build

# Or run in detached mode
docker-compose --profile dev up --build -d
```

Development mode includes:
- Hot reloading for both frontend and backend
- Source code mounted as volumes for live editing
- Development dependencies installed

## Environment Configuration

### Production Environment Variables

The production setup uses these environment variables:

```yaml
# Server
NODE_ENV=production
PORT=5001
JWT_SECRET=svic-scores-production-secret-change-this-in-real-deployment
CLIENT_URL=http://localhost:3000

# Client
REACT_APP_API_URL=/api  # Uses nginx proxy
```

### Development Environment Variables

Development mode uses:

```yaml
# Server
NODE_ENV=development
PORT=5001
JWT_SECRET=svic-scores-development-secret
CLIENT_URL=http://localhost:3000

# Client
REACT_APP_API_URL=http://localhost:5001/api
WATCHPACK_POLLING=true  # For better file watching in containers
```

## Services Overview

### Production Services

1. **server**: Express.js API server
   - Port: 5001
   - Health checks enabled
   - Persistent database volume

2. **client**: React frontend served by Nginx
   - Port: 3000 (nginx on port 80)
   - API requests proxied to server
   - Static file caching

### Development Services

1. **server-dev**: Express.js with nodemon
   - Hot reloading enabled
   - Source code mounted as volume
   - Development dependencies included

2. **client-dev**: React development server
   - Hot reloading enabled
   - Source code mounted as volume
   - Live file watching

## Data Persistence

The application uses Docker volumes for data persistence:

- **server_data**: Production database storage
- **server_dev_data**: Development database storage

Database files persist across container restarts and rebuilds.

## Common Commands

```bash
# Start production services
docker-compose up -d

# Start development services
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Check service health
docker-compose ps
```

## Health Checks

The server includes health checks:

```bash
# Check server health
curl http://localhost:5001/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-07-29T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs [service-name]`
2. Verify port availability: `lsof -i :3000` and `lsof -i :5001`
3. Check Docker resources (memory/disk space)

### Database Issues

1. Check database volume: `docker volume ls`
2. Reset database: `docker-compose down -v && docker-compose up --build`

### Network Issues

1. Verify services can communicate: `docker-compose exec client ping server`
2. Check nginx configuration in client container
3. Verify API_URL environment variables

### Performance Issues

1. Increase Docker memory limit
2. Use `docker system prune` to clean up unused resources
3. Consider using multi-stage builds for smaller images

## Production Deployment

For production deployment:

1. **Change JWT Secret**: Update `JWT_SECRET` in docker-compose.yml
2. **Use External Database**: Consider using external database for better persistence
3. **Add HTTPS**: Use a reverse proxy like Traefik or nginx-proxy
4. **Monitoring**: Add monitoring and logging solutions
5. **Backups**: Implement database backup strategy

### Example Production Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  server:
    environment:
      - JWT_SECRET=your-secure-production-secret
      - CLIENT_URL=https://yourdomain.com
    
  client:
    environment:
      - REACT_APP_API_URL=https://yourdomain.com/api
```

Run with: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

## Security Considerations

1. **Change default JWT secret** before production
2. **Use HTTPS** in production
3. **Implement rate limiting** (already included in server)
4. **Regular security updates** for base images
5. **Network isolation** using Docker networks
6. **Secret management** for sensitive data

## Development Workflow

1. **Start development environment**:
   ```bash
   docker-compose --profile dev up -d
   ```

2. **Make code changes**: Files are automatically synced and services restart

3. **View logs**:
   ```bash
   docker-compose logs -f server-dev client-dev
   ```

4. **Access services**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001/api

5. **Run tests** (if needed):
   ```bash
   docker-compose exec client-dev npm test
   ```

6. **Stop when done**:
   ```bash
   docker-compose --profile dev down
   ```
