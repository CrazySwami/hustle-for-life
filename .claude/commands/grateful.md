---
description: Log gratitude - what are you thankful for today?
argument-hint: [thing 1], [thing 2], [thing 3]
---

# Gratitude Log

Capture what you're grateful for today.

## Input

$ARGUMENTS

If no arguments, prompt for 3 things.

## Process

1. Parse gratitude items (comma-separated or line by line)
2. Log to database:
```sql
INSERT INTO gratitude (entry_date, items, notes)
VALUES (CURRENT_DATE, ARRAY['item1', 'item2', 'item3'], '[notes]');
```

## Prompts (if no input provided)

Ask for 3 things:

1. **One thing that went well today**
   - Even small wins count

2. **One person you're grateful for**
   - Who made a positive difference?

3. **One simple pleasure**
   - Coffee, sunshine, a good song?

## Example Outputs

**Input:** `/grateful Good meeting with team, sunny weather, delicious lunch`
**Output:**
```
Gratitude Logged

Today I'm grateful for:
1. Good meeting with team
2. Sunny weather
3. Delicious lunch

Streak: 7 days of gratitude practice
```

**Input:** `/grateful`
**Output:**
```
Gratitude Check-In

What are 3 things you're grateful for today?

1. Something that went well: ___
2. Someone you appreciate: ___
3. A simple pleasure: ___
```

## Why Gratitude?

- Shifts focus from problems to positives
- Improves mood and well-being
- Takes less than 2 minutes
- Compounds over time

## Streaks

Track consecutive days of gratitude logging:
```
Current streak: 7 days
Longest streak: 21 days
Total entries: 45
```
