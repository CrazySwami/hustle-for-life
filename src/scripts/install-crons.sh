#!/bin/bash
# Hustle for Life - Install Cron Jobs
# This script installs all the reminder cron jobs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY_SCRIPT="$SCRIPT_DIR/notify.sh"

# Make notify.sh executable
chmod +x "$NOTIFY_SCRIPT"

echo "Installing Hustle for Life cron jobs..."
echo "Notification script: $NOTIFY_SCRIPT"
echo ""

# Create the cron entries
CRON_ENTRIES="
# ============================================
# HUSTLE FOR LIFE - Well-Being Reminders
# ============================================

# Morning check-in (7:00 AM)
0 7 * * * $NOTIFY_SCRIPT morning

# Breakfast reminder (8:00 AM, if not logged)
0 8 * * * $NOTIFY_SCRIPT breakfast

# Morning hydration (9:00 AM)
0 9 * * * $NOTIFY_SCRIPT water

# Mid-morning hydration (11:00 AM)
0 11 * * * $NOTIFY_SCRIPT water

# Lunch reminder (12:00 PM)
0 12 * * * $NOTIFY_SCRIPT lunch

# Afternoon hydration (2:00 PM)
0 14 * * * $NOTIFY_SCRIPT water

# Afternoon mood check (3:00 PM)
0 15 * * * $NOTIFY_SCRIPT mood

# Afternoon hydration (4:00 PM)
0 16 * * * $NOTIFY_SCRIPT water

# Dinner reminder (6:00 PM)
0 18 * * * $NOTIFY_SCRIPT dinner

# Evening hydration (7:00 PM)
0 19 * * * $NOTIFY_SCRIPT water

# Wind-down reminders
0  22 * * * $NOTIFY_SCRIPT winddown-first
15 22 * * * $NOTIFY_SCRIPT winddown-second
30 22 * * * $NOTIFY_SCRIPT winddown-urgent
45 22 * * * $NOTIFY_SCRIPT winddown-nag
0  23 * * * $NOTIFY_SCRIPT winddown-nag
30 23 * * * $NOTIFY_SCRIPT winddown-nag
"

# Check for existing crontab
EXISTING_CRON=$(crontab -l 2>/dev/null || echo "")

# Check if Hustle for Life crons already exist
if echo "$EXISTING_CRON" | grep -q "HUSTLE FOR LIFE"; then
    echo "Hustle for Life crons already installed."
    echo ""
    read -p "Replace existing crons? (y/n): " REPLACE
    if [ "$REPLACE" != "y" ]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing Hustle crons
    EXISTING_CRON=$(echo "$EXISTING_CRON" | sed '/# HUSTLE FOR LIFE/,/# END HUSTLE/d')
fi

# Add end marker
CRON_ENTRIES="$CRON_ENTRIES
# END HUSTLE FOR LIFE
"

# Combine and install
NEW_CRON="$EXISTING_CRON$CRON_ENTRIES"
echo "$NEW_CRON" | crontab -

echo "Cron jobs installed successfully!"
echo ""
echo "Installed reminders:"
echo "  - 7:00 AM  : Morning check-in"
echo "  - 8:00 AM  : Breakfast reminder"
echo "  - 9,11,14,16,19: Hydration reminders"
echo "  - 12:00 PM : Lunch reminder"
echo "  - 3:00 PM  : Mood check-in"
echo "  - 6:00 PM  : Dinner reminder"
echo "  - 10:00 PM : Wind-down start"
echo "  - 10:15 PM : Wind-down second"
echo "  - 10:30 PM : Bedtime (urgent)"
echo "  - 10:45, 11:00, 11:30 PM: Nag reminders"
echo ""
echo "View installed crons with: crontab -l"
echo "Remove all crons with: crontab -r"
