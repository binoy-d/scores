# Docker Compose Quick Reference

## Basic Commands

```bash
# Start services in production mode
docker-compose up -d

# Start services in development mode
docker-compose --profile dev up -d

# Start with build (rebuild containers)
docker-compose up --build -d

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## Monitoring & Debugging

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server
docker-compose logs -f client

# Check service status
docker-compose ps

# Check resource usage
docker stats

# Execute commands in running containers
docker-compose exec server sh
docker-compose exec client sh
```

## Maintenance

```bash
# Rebuild specific service
docker-compose build server
docker-compose build client

# Rebuild without cache
docker-compose build --no-cache

# Pull latest base images
docker-compose pull

# Clean up unused Docker resources
docker system prune -f

# View Docker volumes
docker volume ls
```

## Health & Testing

```bash
# Check server health
curl http://localhost:5001/api/health

# Test frontend
curl http://localhost:3000

# Run tests in client container
docker-compose exec client-dev npm test

# Access database (if needed)
docker-compose exec server sqlite3 database/svic_scores.db
```

## Development Workflow

```bash
# 1. Start development environment
docker-compose --profile dev up -d

# 2. Make code changes (auto-reload enabled)

# 3. View logs to debug
docker-compose logs -f server-dev client-dev

# 4. Stop when done
docker-compose --profile dev down
```
