# Hustle For Life Backend - Docker Image
#
# Provides a Node.js server that manages Claude Code CLI processes
# and serves as the backend for the iOS app.

FROM node:20-slim

# Install dependencies for Claude Code CLI
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
# Note: User needs to authenticate Claude Code after container start
RUN npm install -g @anthropic-ai/claude-code

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY src/ ./src/

# Create hustle directory structure
RUN mkdir -p /home/alfonso/hustle/{life-agent,health/data,roi-amplified,mirror-factory}

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HUSTLE_ROOT=/home/alfonso/hustle
ENV HEALTH_DATA_DIR=/home/alfonso/hustle/health/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Run server
CMD ["node", "src/server.js"]
