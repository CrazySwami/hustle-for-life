---
description: Log water intake
argument-hint: [amount in oz or glasses] [beverage type]
---

# Log Water / Hydration

Log water or beverage intake.

## Input

$ARGUMENTS

If no amount specified, default to 8 oz (1 glass).

## Process

1. Parse amount:
   - Number alone: assume oz
   - "glass" or "glasses": multiply by 8 oz
   - "bottle": assume 16 oz
   - "liter" or "L": convert to oz (33.8)

2. Get current time

3. Log to database:
```sql
INSERT INTO hydration (amount_oz, beverage_type)
VALUES ([amount], '[type]');
```

4. Show daily progress

## Example Outputs

**Input:** `/water`
**Output:**
```
+8 oz water

Today: 32 oz / 64 oz target
[████████░░░░░░░░] 50%
```

**Input:** `/water 2 glasses`
**Output:**
```
+16 oz water

Today: 48 oz / 64 oz target
[████████████░░░░] 75%
```

**Input:** `/water bottle coffee`
**Output:**
```
+16 oz coffee

Today: 64 oz / 64 oz target
[████████████████] 100% - Nice!
```

## Hydration Tips

- Aim for 8 glasses (64 oz) daily
- Coffee/tea count but water is best
- Increase on hot days or with exercise
