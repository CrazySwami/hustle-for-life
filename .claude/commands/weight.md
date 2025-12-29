---
description: Log weight measurement
argument-hint: <weight> [unit: lbs|kg]
---

# Log Weight

Record your weight.

## Input

$ARGUMENTS

Default unit: lbs (will convert kg if specified)

## Process

1. Parse weight value
2. Convert to lbs if kg specified
3. Timestamp the reading
4. Log to database:
```sql
INSERT INTO weight (weight_lbs, notes)
VALUES ([weight], '[notes]');
```
5. Show trend if previous data exists

## Example Outputs

**Input:** `/weight 175`
**Output:**
```
Weight: 175.0 lbs
Logged at 7:00 AM

Trend (7 days): 176.2 → 175.0 (-1.2 lbs)
```

**Input:** `/weight 80 kg`
**Output:**
```
Weight: 176.4 lbs (80 kg)
Logged at 7:00 AM
```

## Weighing Tips

- Weigh at the same time daily (morning is best)
- Same conditions (before eating, after bathroom)
- Focus on trends, not daily fluctuations
- Weekly average is more meaningful than daily

## Trend Visualization

When enough data exists:

```
Last 7 days:
Mon: 176.5 ▪▪▪▪▪▪▪▪▪▪▪▪
Tue: 176.2 ▪▪▪▪▪▪▪▪▪▪▪
Wed: 175.8 ▪▪▪▪▪▪▪▪▪▪
Thu: 176.0 ▪▪▪▪▪▪▪▪▪▪▪
Fri: 175.5 ▪▪▪▪▪▪▪▪▪
Sat: 175.2 ▪▪▪▪▪▪▪▪
Sun: 175.0 ▪▪▪▪▪▪▪▪

Avg: 175.7 lbs | Trend: -1.5 lbs/week
```
