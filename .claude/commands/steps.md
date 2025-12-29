---
description: Log daily step count
argument-hint: <step count> [notes]
---

# Log Steps

Record your daily step count.

## Input

$ARGUMENTS

## Process

1. Parse step count
2. Log to database:
```sql
INSERT INTO activity (activity_date, steps, notes)
VALUES (CURRENT_DATE, [steps], '[notes]')
ON CONFLICT (activity_date)
DO UPDATE SET steps = [steps], notes = '[notes]';
```

3. Show progress toward goal

## Example Outputs

**Input:** `/steps 8432`
**Output:**
```
Steps: 8,432 / 10,000 target
[████████████░░░░] 84%

Nice progress! 1,568 more to hit your goal.
```

**Input:** `/steps 12500`
**Output:**
```
Steps: 12,500 / 10,000 target
[████████████████] 125%

Goal crushed! You're 2,500 steps over target.
```

**Input:** `/steps 4200 desk day`
**Output:**
```
Steps: 4,200 / 10,000 target
[██████░░░░░░░░░░] 42%

Note: desk day

Tip: A 10-min walk = ~1,000 steps
```

## Weekly View

When data exists:

```
This Week's Steps

Mon: 9,234  [█████████░] 92%
Tue: 11,456 [██████████] 115%
Wed: 7,890  [███████░░░] 79%
Thu: 8,432  [████████░░] 84%  ← Today
Fri: --
Sat: --
Sun: --

Avg so far: 9,253 steps/day
Days hitting 10k: 1/4
```

## Integration Note

For automatic step tracking, export from:
- Apple Health
- Google Fit
- Fitbit
- Garmin

Use `/steps import` to bulk import (future feature).
