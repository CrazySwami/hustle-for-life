---
description: Log blood pressure reading
argument-hint: <systolic/diastolic> [pulse] [notes]
---

# Log Blood Pressure

Record a blood pressure reading.

## Input

$ARGUMENTS

## Format

- `120/80` - Standard format
- `120 80` - Space separated
- `120/80 72` - With pulse

## Process

1. Parse systolic and diastolic values
2. Parse optional pulse/heart rate
3. Timestamp the reading
4. Log to database:
```sql
INSERT INTO vitals (vital_type, systolic, diastolic, bpm, notes)
VALUES ('blood_pressure', [sys], [dia], [pulse], '[notes]');
```

## Blood Pressure Categories

| Category | Systolic | Diastolic |
|----------|----------|-----------|
| Normal | < 120 | < 80 |
| Elevated | 120-129 | < 80 |
| High (Stage 1) | 130-139 | 80-89 |
| High (Stage 2) | 140+ | 90+ |
| Crisis | 180+ | 120+ |

## Example Outputs

**Input:** `/bp 118/76`
**Output:**
```
Blood Pressure: 118/76 mmHg
Category: Normal
Logged at 8:00 AM
```

**Input:** `/bp 132/85 68`
**Output:**
```
Blood Pressure: 132/85 mmHg
Pulse: 68 bpm
Category: High (Stage 1)
Logged at 8:00 AM

Consider: Check again in a few hours if unusual.
```

## Tips for Accurate Readings

- Rest 5 minutes before measuring
- Sit with feet flat, arm supported
- Don't talk during measurement
- Take at consistent times daily
- Morning readings are often most reliable
