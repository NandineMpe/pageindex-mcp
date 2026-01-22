# Use Node.js LTS as base image
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ENV CLIENT_TYPE=production
RUN bun run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install bun for runtime
RUN npm install -g bun

# Copy package files and install production dependencies
COPY package.json ./
RUN bun install --production --frozen-lockfile

# Copy built application
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV CLIENT_TYPE=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "build/index-http.js"]
