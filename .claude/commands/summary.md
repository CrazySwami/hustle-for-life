---
description: Health summary for today, this week, or this month
argument-hint: [today|week|month]
---

# Health Summary

Generate a summary of your health data.

## Time Period

$ARGUMENTS

Default: today

## Today's Summary

### Data to Gather

Query the database for today's entries:
- Meals logged
- Water intake (total oz)
- Mood readings (average)
- Vitals (if any)
- Activity/steps
- Sleep (last night)

### Format

```
Daily Summary - [Date]

SLEEP
Last night: 7.5 hours
Quality: ⭐⭐⭐⭐ (4/5)
Bedtime: 10:45 PM | Wake: 6:15 AM

NUTRITION
Meals: ✓ Breakfast ✓ Lunch ✓ Dinner
Logged: 3/3

HYDRATION
Water: 56 oz / 64 oz target
[██████████████░░] 88%

MOOD
Average: ⭐⭐⭐⭐ (3.8/5)
Range: 3-4
Energy: ⭐⭐⭐ (3/5)

ACTIVITY
Steps: 8,432 / 10,000
[████████████░░░░] 84%

VITALS
BP: 118/76 (Normal)
Glucose: 95 mg/dL (Fasting, Normal)
```

## Weekly Summary

### Data to Gather

- Daily averages for the week
- Trends compared to previous week
- Streaks (consecutive days)
- Goal completion rates

### Format

```
Weekly Summary - Week of [Date]

OVERVIEW
Days with full tracking: 6/7

SLEEP
Avg duration: 7.2 hours
Avg quality: 3.8/5
Best night: Tuesday (8.5 hrs)
Trend: ↑ +0.5 hrs vs last week

NUTRITION
Meals logged: 18/21 (86%)
Streak: 5 days
Trend: ↑ Improved from 71%

HYDRATION
Avg daily: 52 oz
Days hitting target: 4/7
Trend: ↔ Stable

MOOD
Avg mood: 3.6/5
Best day: Saturday (4.5)
Lowest: Monday (2.8)
Trend: ↔ Stable

ACTIVITY
Avg steps: 8,234
Active days: 5/7
Exercise sessions: 3
Trend: ↑ +1,200 steps/day

WINS THIS WEEK
✓ 5-day meal logging streak
✓ Hit step goal 4 times
✓ Consistent bedtime

FOCUS FOR NEXT WEEK
→ Increase water intake
```

## Monthly Summary

### Additional Insights

- Weight trend
- Overall patterns
- Month-over-month comparison
- Correlation insights

### Format

```
Monthly Summary - [Month Year]

HIGHLIGHTS
- Avg sleep: 7.1 hours
- Avg mood: 3.7/5
- Avg steps: 7,890
- Weight change: -2.3 lbs

BEST WEEK: Week 3
MOST CONSISTENT: Sleep (28/30 days)
NEEDS ATTENTION: Hydration (avg 48 oz)

PATTERNS NOTICED
- Mood correlates with sleep (r=0.72)
- Energy dips on low-step days
- Best mood on exercise days

30-DAY STREAKS
- Mood logging: 28 days
- Meal logging: 22 days
- Step tracking: 30 days

GOALS PROGRESS
Sleep 7+ hrs: 73% of days
10k steps: 47% of days
64oz water: 40% of days
```
