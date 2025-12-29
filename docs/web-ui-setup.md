# Hustle for Life - Web UI Setup

Use CUI (Common Agent UI) to access Hustle for Life from any browser.

## Quick Start (Mac)

```bash
# Start the web UI
cd /path/to/hustle-for-life
npx cui-server --port 3001

# Opens at http://localhost:3001
```

The first time you run it, you'll get an auth token URL like:
```
http://localhost:3001#token=your-token-here
```

## Features

- **Resume sessions** - CUI scans your `~/.claude/` history
- **Multiple tasks** - Run several agents in parallel
- **Background tasks** - Close the tab, work continues
- **Push notifications** - Know when tasks complete
- **Voice input** - Dictate prompts (requires Gemini key)

## Running on Your Mac

### Option 1: Foreground (for testing)
```bash
npx cui-server --port 3001
```

### Option 2: Background (persistent)
```bash
# Start in background
nohup npx cui-server --port 3001 > ~/.cui/server.log 2>&1 &

# Check if running
curl http://localhost:3001

# Stop it
pkill -f "cui-server"
```

### Option 3: As a macOS Service (launchd)

Create `~/Library/LaunchAgents/com.hustle.cui.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hustle.cui</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npx</string>
        <string>cui-server</string>
        <string>--port</string>
        <string>3001</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/alfonso/Documents/GitHub/hustle-for-life</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/alfonso/.cui/server.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/alfonso/.cui/server.log</string>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.hustle.cui.plist
```

## Running on Proxmox

### Prerequisites

1. Install Node.js 20+ on Proxmox:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Install Claude Code:
```bash
npm install -g @anthropic-ai/claude-code
claude auth login  # Authenticate
```

3. Clone Hustle for Life:
```bash
git clone https://github.com/CrazySwami/hustle-for-life.git
cd hustle-for-life
```

### Run CUI on Proxmox

```bash
# Install and run
npx cui-server --port 3001 --host 0.0.0.0

# Access from your network
# http://your-proxmox-ip:3001
```

### As a systemd Service (Proxmox)

Create `/etc/systemd/system/hustle-cui.service`:

```ini
[Unit]
Description=Hustle for Life CUI Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/hustle-for-life
ExecStart=/usr/bin/npx cui-server --port 3001 --host 0.0.0.0
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hustle-cui
sudo systemctl start hustle-cui
```

## Remote Access (from your phone)

### Option A: Local Network
Access via your Mac's local IP:
```
http://192.168.x.x:3001#token=your-token
```

### Option B: Tailscale (recommended)
If you use Tailscale, access via your Tailscale IP:
```
http://your-mac.tailnet:3001
```

### Option C: SSH Tunnel
```bash
# From your phone/laptop, tunnel to your Mac
ssh -L 3001:localhost:3001 your-mac

# Then access localhost:3001
```

## Configuration

CUI stores config at `~/.cui/config.json`:

```json
{
  "machineId": "your-machine-id",
  "port": 3001,
  "host": "localhost",
  "ntfy": {
    "enabled": true,
    "topic": "hustle-life-your-id"
  }
}
```

## Using with Hustle for Life Commands

Once CUI is running, you can use all your slash commands:

- `/winddown` - End of day ritual
- `/meal breakfast` - Log breakfast
- `/water 8oz` - Log water
- `/mood 4` - Log mood
- `/checkin` - Full check-in
- `/summary` - Health summary

The web UI makes it easy to log from your phone!

## Troubleshooting

### CUI won't start
```bash
# Check if port is in use
lsof -i :3001

# Kill existing process
pkill -f "cui-server"
```

### Can't connect remotely
```bash
# Make sure to use --host 0.0.0.0 for remote access
npx cui-server --port 3001 --host 0.0.0.0
```

### Claude Code not authenticated
```bash
# Re-authenticate
claude auth login
```
