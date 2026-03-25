#!/bin/bash
# Promote staging → production → deploy to live
# Run this after the agent has tested changes on staging (:3501)

set -e

PROD="/home/dev/repos/hustle-for-life"
STAGING="/home/dev/repos/hustle-for-life-staging"

echo "=== Promoting staging → production ==="

# 1. Make sure staging has all changes committed
cd "$STAGING"
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Staging has uncommitted changes. Commit first."
  exit 1
fi

STAGING_HEAD=$(git rev-parse HEAD)
echo "Staging HEAD: $STAGING_HEAD"

# 2. Switch to production and merge staging
cd "$PROD"
PROD_HEAD=$(git rev-parse HEAD)
echo "Production HEAD: $PROD_HEAD"

if [ "$STAGING_HEAD" = "$PROD_HEAD" ]; then
  echo "Already up to date. Nothing to promote."
  exit 0
fi

git merge staging --no-edit
echo "Merged staging → expo-react-native"

# 3. Deploy the server changes to live
echo ""
bash "$PROD/deploy.sh"

# 4. Push production to gitea
git push gitea expo-react-native 2>/dev/null || true

echo ""
echo "=== Promotion complete ==="
echo "  Staging  → Production: merged"
echo "  Server   → Live:       deployed"
echo "  App changes: pull + restart expo on your device"

curl -H "Title: Staging Promoted" -H "Tags: white_check_mark" \
  -d "Staging merged to production and deployed to live." ntfy.sh/hustleserver 2>/dev/null || true
