# Hustle For Life - Backend Server

Backend server that wraps Claude Code CLI and provides the API for the iOS app.

## Architecture

```
iOS App <--> WebSocket <--> Backend Server <--> Claude Code CLI
                              |
                              +-> Health Data Storage (JSON files)
                              +-> PostgreSQL (optional, for structured data)
```

## Quick Start

### 1. Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm run dev
```

### 2. Docker Deployment

```bash
# Set required environment variable
export POSTGRES_PASSWORD=your_secure_password

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### 3. Claude Code Authentication

On first run, Claude Code needs to authenticate with your Claude account:

```bash
# Enter the container
docker exec -it hustle-backend bash

# Run Claude Code to authenticate
claude

# It will provide a URL - open it in your browser and authenticate
# Credentials are saved to /root/.claude/credentials.json
```

## API Reference

### WebSocket: `/ws`

Connect via WebSocket for real-time chat with Claude Code.

**Messages from Client:**

```json
// Join a session
{ "type": "join", "sessionId": "optional-existing-id", "department": "life-agent" }

// Send input to Claude
{ "type": "input", "text": "Hello, how can you help me today?" }

// Abort current operation (Ctrl+C)
{ "type": "abort" }

// Ping for keepalive
{ "type": "ping" }
```

**Messages from Server:**

```json
// Session joined confirmation
{ "type": "joined", "sessionId": "uuid", "department": "life-agent", "name": "...", "isNew": true }

// Claude's response
{ "type": "assistant", "message": { "type": "text", "content": "Hello! I'm here to help..." } }

// Tool usage
{ "type": "tool_use", "name": "Read", "input": { "file_path": "/path/to/file" } }

// Tool result
{ "type": "tool_result", "content": "file contents..." }

// Error
{ "type": "error", "content": "error message" }

// Session ended
{ "type": "exit", "code": 0 }
```

### REST API

#### Departments

- `GET /api/departments` - List available departments
- `GET /api/sessions` - List all sessions
- `GET /api/sessions?department=life-agent` - List sessions for a department
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - Archive session
- `GET /api/sessions/:id/files?prefix=src` - List files (for @file autocomplete)

#### Health Data

- `POST /api/health-data` - Ingest health data from iOS
- `GET /api/health-data` - Get today's health data
- `GET /api/health-data/:date` - Get health data for specific date
- `GET /api/health-data?days=7` - Get last N days
- `GET /api/health-data?start=2024-01-01&end=2024-01-31` - Get date range
- `GET /api/health-data/summary/7` - Get markdown summary (for Claude)
- `POST /api/health-data/metric` - Log single metric

## Department Structure

Each department is a directory under `$HUSTLE_ROOT` (default: `/home/alfonso/hustle`):

```
/home/alfonso/hustle/
├── life-agent/
│   ├── CLAUDE.md          # Life Agent's personality & context
│   └── state-of-alfonso.md # Persistent state
├── health/
│   ├── CLAUDE.md          # Health department context
│   └── data/              # HealthKit synced data
│       ├── 2024-12-30.json
│       └── ...
├── roi-amplified/
│   └── CLAUDE.md          # Work context
└── mirror-factory/
    └── CLAUDE.md          # Personal business context
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `HUSTLE_ROOT` | `/home/alfonso/hustle` | Root directory for departments |
| `HEALTH_DATA_DIR` | `.../health/data` | Health data storage directory |
| `DATABASE_URL` | - | PostgreSQL connection (optional) |

## Security

This server spawns Claude Code CLI processes that can execute shell commands. **DO NOT** expose this server to the public internet.

Recommended deployment:
- Run on a private server (e.g., Proxmox VM)
- Access via Tailscale VPN only
- No public ports exposed

## License

MIT
