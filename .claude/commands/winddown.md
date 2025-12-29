---
description: End of day wind-down ritual - summarize day and prepare for sleep
argument-hint: [notes for tomorrow]
---

# Wind Down Ritual

Your end-of-day closing ritual. Summarize the day, set tomorrow's priorities, and prepare for restful sleep.

## Step 1: Check the Time

```bash
date "+%H:%M on %A, %B %d"
```

If it's after 10:30 PM, include a firm but caring reminder about sleep.

## Step 2: Review Today's Health Data

Check what was logged today:
- Meals eaten
- Water intake
- Mood readings
- Activity/steps
- Any vitals logged

## Step 3: Quick Evening Check-In

Ask (if not already logged):
1. How was your overall mood today? (1-5)
2. Did you get any exercise?
3. How much water did you drink?
4. Anything weighing on your mind?

## Step 4: Create Tomorrow's Plan

Based on today:
- What's the ONE most important thing for tomorrow?
- Any appointments or commitments?
- Self-care priority for tomorrow?

## Step 5: Gratitude (Optional)

Quick gratitude prompt:
- One thing that went well today
- One person you're grateful for
- One thing you're looking forward to

## Step 6: Log Sleep Start

```sql
INSERT INTO sleep (sleep_date, bedtime)
VALUES (CURRENT_DATE, NOW());
```

## Step 7: Send Notification

```bash
curl -s -H "Title: Session Closed" \
     -H "Tags: sleeping,zzz" \
     -d "Wind-down complete. Time for rest." \
     ntfy.sh/${NTFY_TOPIC:-hustle-life}
```

## Step 8: Closing Message

---

## Day Complete

**Today's Wins:**
- [Win 1]
- [Win 2]

**Tomorrow's Focus:**
- [Priority 1]

**Remember:**
The code will still be here tomorrow.
Your brain needs sleep to consolidate today's learning.
Going to bed now = better performance tomorrow.

Good night.

---

## Additional Notes

$ARGUMENTS
