# Multi-stage: build CRA frontend, run Node server

FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source files needed for build
COPY public ./public
COPY src ./src
COPY postcss.config.js tailwind.config.js ./
COPY package.json ./

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine AS server
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built React app from builder stage
COPY --from=builder /app/build ./build

# Copy server files
COPY server ./server

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check (optional, can be overridden in docker-compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "server/index.js"]





