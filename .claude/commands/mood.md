---
description: Log current mood and energy level
argument-hint: <1-5> [energy 1-5] [notes]
---

# Log Mood

Quick mood and energy check-in.

## Input

$ARGUMENTS

## Scale

| Rating | Mood | Energy |
|--------|------|--------|
| 1 | Struggling | Exhausted |
| 2 | Low | Tired |
| 3 | Okay | Moderate |
| 4 | Good | Energized |
| 5 | Great | Peak |

## Process

1. Parse input:
   - First number: mood (1-5)
   - Second number (optional): energy (1-5)
   - Remaining text: notes

2. Log to database:
```sql
INSERT INTO mood (mood_rating, energy_rating, notes)
VALUES ([mood], [energy], '[notes]');
```

3. Acknowledge with brief response

## Example Outputs

**Input:** `/mood 4`
**Output:**
```
Mood: ⭐⭐⭐⭐ Good
Logged at 2:30 PM
```

**Input:** `/mood 3 2 feeling tired after lunch`
**Output:**
```
Mood: ⭐⭐⭐ Okay
Energy: ⚡⚡ Tired
Note: feeling tired after lunch
Logged at 2:30 PM

Tip: Post-lunch dip is normal. A short walk can help!
```

**Input:** `/mood 5 5`
**Output:**
```
Mood: ⭐⭐⭐⭐⭐ Great!
Energy: ⚡⚡⚡⚡⚡ Peak!
Logged at 2:30 PM

Awesome! Capture what's working today.
```

## Patterns to Notice

- After analyzing multiple entries, note patterns like:
  - "Mood tends to dip around 3 PM"
  - "Higher mood on days with morning exercise"
  - "Energy correlates with sleep quality"
