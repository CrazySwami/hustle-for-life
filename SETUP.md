# Hustle For Life - Complete Setup Instructions

This document provides step-by-step instructions for setting up and running the Hustle For Life iOS app and backend server.

---

## IMPORTANT: Platform Requirements

This is a **native iOS app** that requires **macOS with Xcode** to build and run.

| Component | Platform | Requirements |
|-----------|----------|--------------|
| **iOS App** | macOS only | Xcode 15+, macOS 14+ |
| **Backend Server** | Any (Mac/Linux/Docker) | Node.js 20+ |
| **Testing** | iOS Simulator or iPhone | macOS required |

**You MUST run these instructions on a Mac.** The iOS app cannot be built on Linux or Windows.

---

## Prerequisites

### Required (on macOS)
- **macOS 14+** (Sonoma or later recommended)
- **Xcode 15+** - Install from Mac App Store
- **Node.js 20+** - Install via `brew install node@20`
- **XcodeGen** - Install via `brew install xcodegen`
- **Claude Code CLI** - Install via `npm install -g @anthropic-ai/claude-code`

### Optional
- **Docker** - For containerized backend deployment
- **Tailscale** - For secure remote access from physical iPhone

---

## Part 1: Clone the Repository

```bash
git clone https://github.com/CrazySwami/hustle-for-life.git
cd hustle-for-life
```

---

## Part 2: Backend Server Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development):
```
PORT=3000
LOG_LEVEL=info
HUSTLE_ROOT=/tmp/hustle
HEALTH_DATA_DIR=/tmp/hustle/health/data
```

### 2.3 Create Department Directories

The backend expects department directories to exist:

```bash
mkdir -p /tmp/hustle/{life-agent,health/data,roi-amplified,mirror-factory}

# Copy department CLAUDE.md files
cp -r ../departments/* /tmp/hustle/
```

### 2.4 Start the Backend Server

```bash
node src/server.js
```

Expected output:
```
[INFO] Hustle For Life backend server running on port 3000
[INFO] WebSocket endpoint: ws://localhost:3000/ws
[INFO] REST API: http://localhost:3000/api
[INFO] Available departments: life-agent, health, roi-amplified, mirror-factory
```

### 2.5 Verify Backend is Running

```bash
# In a new terminal
curl http://localhost:3000/api/health
# Should return: {"status":"ok","version":"1.0.0",...}

curl http://localhost:3000/api/departments
# Should return list of departments
```

---

## Part 3: iOS App Setup

### 3.1 Generate Xcode Project

```bash
cd ios/HustleForLife

# Install xcodegen if not installed
brew install xcodegen

# Generate the .xcodeproj
xcodegen generate
```

### 3.2 Open in Xcode

```bash
open HustleForLife.xcodeproj
```

### 3.3 Configure Signing

1. Select the project in the navigator (top-left)
2. Select the "HustleForLife" target
3. Go to "Signing & Capabilities" tab
4. Select your Development Team
5. Ensure "Automatically manage signing" is checked

### 3.4 Add HealthKit Capability (if not present)

1. In "Signing & Capabilities" tab
2. Click "+ Capability"
3. Search for "HealthKit" and add it

### 3.5 Configure Server URL

The default URL is `ws://localhost:3000/ws` which works for the iOS Simulator.

For physical device testing, update the URL in:
- `HustleForLife/App/HustleForLifeApp.swift` line 64
- Or change it in the app's Settings screen after launching

Use your Mac's local IP address (e.g., `ws://192.168.1.100:3000/ws`).

Find your Mac's IP:
```bash
ipconfig getifaddr en0
```

### 3.6 Build and Run

1. Select "iPhone 15 Pro" simulator (or your connected device)
2. Press Cmd+R or click the Play button
3. The app should launch and connect to the backend

---

## Part 4: Testing the Full Stack

### 4.1 Verify Connection

1. Launch the iOS app
2. Check the sidebar - should show "Connected" status
3. Select a department (e.g., "Life Agent")
4. Type a message and send

### 4.2 Expected Behavior

When you send a message:
1. The message appears in the chat
2. "Claude is thinking..." indicator shows
3. Claude Code processes the message
4. Response streams back to the app

### 4.3 Test Slash Commands

Try these commands in the chat:
- `/help` - Show available commands
- `/compact` - Compress conversation history
- `/meal Had a salad for lunch` - Log a meal
- `/mood 4 Feeling good today` - Log mood

---

## Part 5: Troubleshooting

### Backend Issues

**"Claude Code CLI not found"**
```bash
npm install -g @anthropic-ai/claude-code
# Then authenticate:
claude
# Follow the OAuth flow in browser
```

**"ENOENT: no such file or directory"**
```bash
# Ensure department directories exist
mkdir -p /tmp/hustle/{life-agent,health/data,roi-amplified,mirror-factory}
```

**Port already in use**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### iOS App Issues

**"No such module 'HealthKit'"**
- Ensure HealthKit capability is added in Signing & Capabilities

**"Connection refused"**
- Ensure backend is running on port 3000
- For physical device: use Mac's IP, not localhost
- Check firewall settings

**XcodeGen fails**
```bash
# Ensure xcodegen is installed
brew install xcodegen

# If project.yml has issues, regenerate:
xcodegen generate --spec project.yml
```

### HealthKit Issues

**"HealthKit not available"**
- HealthKit doesn't work in the Simulator
- Test HealthKit features on a physical device
- Ensure HealthKit entitlements are configured

---

## Part 6: Docker Deployment (Optional)

For production deployment on a server:

```bash
cd backend

# Set required password
export POSTGRES_PASSWORD=your_secure_password

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Authenticate Claude Code inside container
docker exec -it hustle-backend claude
```

---

## Part 7: Project Structure Reference

```
hustle-for-life/
├── backend/                    # Node.js backend server
│   ├── src/
│   │   ├── server.js          # Main server (Express + WebSocket)
│   │   ├── session-manager.js # Claude Code process management
│   │   └── health-data.js     # HealthKit data storage
│   ├── package.json
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── ios/HustleForLife/          # iOS/watchOS app
│   ├── HustleForLife/
│   │   ├── App/               # App entry point
│   │   ├── Models/            # Data models
│   │   ├── Services/          # WebSocket, HealthKit
│   │   └── Views/             # SwiftUI views
│   ├── HustleForLifeWatch/    # watchOS companion
│   └── project.yml            # XcodeGen spec
│
├── departments/                # Department CLAUDE.md templates
│   ├── life-agent/
│   ├── health/
│   ├── roi-amplified/
│   └── mirror-factory/
│
└── docker/                     # PostgreSQL setup
    ├── docker-compose.yml
    └── init.sql
```

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Install Node.js dependencies (`cd backend && npm install`)
- [ ] Create department directories (`mkdir -p /tmp/hustle/...`)
- [ ] Copy department files (`cp -r departments/* /tmp/hustle/`)
- [ ] Start backend (`node src/server.js`)
- [ ] Verify backend (`curl http://localhost:3000/api/health`)
- [ ] Install xcodegen (`brew install xcodegen`)
- [ ] Generate Xcode project (`cd ios/HustleForLife && xcodegen generate`)
- [ ] Open in Xcode (`open HustleForLife.xcodeproj`)
- [ ] Configure signing (select your team)
- [ ] Build and run (Cmd+R)
- [ ] Test chat functionality

---

## API Reference

### WebSocket: `ws://localhost:3000/ws`

```json
// Join session
{"type": "join", "department": "life-agent"}

// Send message
{"type": "input", "text": "Hello!"}

// Abort current operation
{"type": "abort"}
```

### REST API: `http://localhost:3000/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/departments` | GET | List departments |
| `/api/sessions` | GET | List sessions |
| `/api/sessions` | POST | Create session |
| `/api/health-data` | POST | Sync health data |
| `/api/health-data/:date` | GET | Get health data |

---

## Support

For issues, check:
1. Backend logs in terminal
2. Xcode console for iOS errors
3. Network tab in Safari Web Inspector (for WebSocket issues)
