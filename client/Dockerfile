# Production Dockerfile for React client
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle TypeScript version conflicts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set API URL for production (will be handled by nginx proxy)
ENV REACT_APP_API_URL=/api

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
