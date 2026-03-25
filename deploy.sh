#!/bin/bash
# Deploy script — copies server/ to the running service and restarts
# The agent or CLI runs this after changes are tested and ready

set -e

SRC="/home/dev/repos/hustle-for-life/server"
DEST="/home/dev/services/life-api"
SERVICE="hustle-life-api"

echo "📦 Deploying server/ → services/life-api/"

# Copy everything except node_modules and .env (keep deployed .env intact)
# Using cp + find instead of rsync for compatibility
find "$SRC" -maxdepth 1 -not -name 'node_modules' -not -name '.env' -not -path "$SRC" -exec cp -r {} "$DEST/" \;

# Install deps if package.json changed
cd "$DEST"
npm install --legacy-peer-deps 2>/dev/null

# Restart the service
systemctl --user restart "$SERVICE"
sleep 2

# Verify
STATUS=$(curl -sf http://localhost:3500/health | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])" 2>/dev/null)

if [ "$STATUS" = "ok" ]; then
  echo "✅ Deploy successful — service is running"
  curl -H "Title: Life API Deployed" -H "Tags: rocket" \
    -d "Server updated and restarted successfully" ntfy.sh/hustleserver 2>/dev/null
else
  echo "❌ Deploy failed — service not responding"
  echo "Rolling back..."
  systemctl --user restart "$SERVICE"
  curl -H "Title: Deploy Failed" -H "Tags: x" -H "Priority: high" \
    -d "Life API deploy failed — service restarted with previous version" ntfy.sh/hustleserver 2>/dev/null
fi
