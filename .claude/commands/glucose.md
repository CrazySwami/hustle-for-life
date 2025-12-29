---
description: Log blood sugar/glucose reading
argument-hint: <mg/dL> [context: fasting|before|after|bedtime]
---

# Log Blood Sugar

Record a blood glucose reading.

## Input

$ARGUMENTS

## Context Options

- `fasting` - First thing in morning, no food
- `before` - Before a meal
- `after` - 2 hours after eating
- `bedtime` - Before sleep
- `random` - Any other time (default)

## Process

1. Parse glucose value (mg/dL)
2. Determine context from input or ask
3. Timestamp the reading
4. Log to database:
```sql
INSERT INTO vitals (vital_type, glucose_mg_dl, glucose_context, notes)
VALUES ('blood_sugar', [value], '[context]', '[notes]');
```

## Blood Sugar Ranges (mg/dL)

| Context | Normal | Pre-diabetic | Diabetic |
|---------|--------|--------------|----------|
| Fasting | < 100 | 100-125 | 126+ |
| After meal | < 140 | 140-199 | 200+ |
| Random | < 140 | 140-199 | 200+ |

## Example Outputs

**Input:** `/glucose 95 fasting`
**Output:**
```
Blood Sugar: 95 mg/dL (Fasting)
Status: Normal
Logged at 7:00 AM
```

**Input:** `/glucose 165 after`
**Output:**
```
Blood Sugar: 165 mg/dL (After meal)
Status: Elevated
Logged at 2:00 PM

Note: Slightly above target. Consider meal composition.
```

**Input:** `/glucose 82`
**Output:**
```
Blood Sugar: 82 mg/dL
Status: Normal
Logged at 3:30 PM
```

## Tracking Tips

- Log consistently at same times
- Note what you ate before high readings
- Track patterns over time
- Share trends with your doctor
