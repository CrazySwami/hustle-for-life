#!/bin/bash
# Hustle for Life - NTFY Notification Helper
# Usage: ./notify.sh <type> [message]

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env" ]; then
    source "$SCRIPT_DIR/../../.env"
fi

TOPIC="${NTFY_TOPIC:-hustle-life}"
SERVER="${NTFY_SERVER:-https://ntfy.sh}"

send_notification() {
    local title="$1"
    local message="$2"
    local tags="$3"
    local priority="${4:-default}"

    curl -s \
        -H "Title: $title" \
        -H "Tags: $tags" \
        -H "Priority: $priority" \
        -d "$message" \
        "$SERVER/$TOPIC"
}

case "$1" in
    # Morning reminders
    "morning")
        send_notification \
            "Good Morning!" \
            "Time for your morning check-in. How did you sleep?" \
            "sunrise,coffee" \
            "default"
        ;;

    # Hydration reminders
    "water")
        send_notification \
            "Hydration Check" \
            "Have you had water recently? Stay hydrated!" \
            "droplet" \
            "low"
        ;;

    # Meal reminders
    "breakfast")
        send_notification \
            "Breakfast Time" \
            "Don't skip breakfast! Log what you eat with /meal" \
            "pancakes" \
            "default"
        ;;

    "lunch")
        send_notification \
            "Lunch Check-In" \
            "Time for lunch! Remember to log your meal." \
            "sandwich" \
            "default"
        ;;

    "dinner")
        send_notification \
            "Dinner Time" \
            "Evening meal time. What's for dinner?" \
            "fork_and_knife" \
            "default"
        ;;

    # Wind-down reminders
    "winddown-first")
        send_notification \
            "Time to Wind Down" \
            "It's 10:00 PM. Start wrapping up. Run /winddown when ready." \
            "clock10" \
            "default"
        ;;

    "winddown-second")
        send_notification \
            "Time to Stop" \
            "It's 10:15 PM. Run /winddown and prepare for bed." \
            "warning" \
            "high"
        ;;

    "winddown-urgent")
        send_notification \
            "GO TO BED" \
            "It's 10:30 PM - your target bedtime. Close the laptop NOW." \
            "rotating_light" \
            "urgent"
        ;;

    "winddown-nag")
        CURRENT_TIME=$(date "+%H:%M")
        send_notification \
            "Still Awake?" \
            "It's $CURRENT_TIME. You said you'd stop by 10:30. Go. To. Sleep." \
            "face_with_raised_eyebrow" \
            "high"
        ;;

    # Mood check-ins
    "mood")
        send_notification \
            "Mood Check" \
            "Quick check: How are you feeling right now? (1-5)" \
            "thought_balloon" \
            "low"
        ;;

    # Activity reminders
    "move")
        send_notification \
            "Time to Move" \
            "You've been sitting for a while. Take a short walk!" \
            "walking" \
            "default"
        ;;

    "posture")
        send_notification \
            "Posture Check" \
            "Sit up straight! Roll your shoulders back." \
            "person_in_lotus_position" \
            "low"
        ;;

    "eyes")
        send_notification \
            "Eye Break (20-20-20)" \
            "Look at something 20 feet away for 20 seconds." \
            "eyes" \
            "low"
        ;;

    # Medication reminder
    "meds")
        send_notification \
            "Medication Reminder" \
            "Time to take your medication." \
            "pill" \
            "high"
        ;;

    # Custom message
    "custom")
        shift
        send_notification \
            "Hustle for Life" \
            "$*" \
            "bell" \
            "default"
        ;;

    # Test
    "test")
        send_notification \
            "Notification Test" \
            "Hustle for Life notifications are working!" \
            "test_tube" \
            "low"
        echo "Test notification sent to $SERVER/$TOPIC"
        ;;

    *)
        echo "Usage: $0 <type> [message]"
        echo ""
        echo "Types:"
        echo "  morning          - Morning check-in prompt"
        echo "  water            - Hydration reminder"
        echo "  breakfast        - Breakfast reminder"
        echo "  lunch            - Lunch reminder"
        echo "  dinner           - Dinner reminder"
        echo "  winddown-first   - 10:00 PM wind-down"
        echo "  winddown-second  - 10:15 PM wind-down"
        echo "  winddown-urgent  - 10:30 PM urgent"
        echo "  winddown-nag     - Post 10:30 PM nag"
        echo "  mood             - Mood check-in prompt"
        echo "  move             - Movement reminder"
        echo "  posture          - Posture check"
        echo "  eyes             - 20-20-20 eye break"
        echo "  meds             - Medication reminder"
        echo "  custom <msg>     - Custom message"
        echo "  test             - Test notification"
        exit 1
        ;;
esac
