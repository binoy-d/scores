# Production image
FROM node:18-alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy all source code
COPY . .

# Create database directory if it doesn't exist
RUN mkdir -p database

# Initialize database
RUN npm run init-db

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["npm", "start"]