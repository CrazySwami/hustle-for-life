#!/bin/bash
# Hustle for Life - Uninstall Cron Jobs
# This script removes Hustle for Life cron jobs

echo "Removing Hustle for Life cron jobs..."

# Get existing crontab
EXISTING_CRON=$(crontab -l 2>/dev/null || echo "")

# Check if Hustle for Life crons exist
if ! echo "$EXISTING_CRON" | grep -q "HUSTLE FOR LIFE"; then
    echo "No Hustle for Life crons found."
    exit 0
fi

# Remove Hustle crons (between markers)
NEW_CRON=$(echo "$EXISTING_CRON" | sed '/# ===.*HUSTLE FOR LIFE/,/# END HUSTLE/d')

# Install cleaned crontab
if [ -z "$NEW_CRON" ]; then
    crontab -r 2>/dev/null
    echo "All crons removed (crontab is now empty)."
else
    echo "$NEW_CRON" | crontab -
    echo "Hustle for Life crons removed."
    echo "Other crons preserved."
fi

echo ""
echo "Current crontab:"
crontab -l 2>/dev/null || echo "(empty)"
