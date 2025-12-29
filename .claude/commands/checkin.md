---
description: Full health check-in - mood, meals, hydration, activity
argument-hint: [morning|afternoon|evening]
---

# Health Check-In

Comprehensive check-in to log current status.

## Check-In Type

$ARGUMENTS

If not specified, determine by time:
- Before 11am: morning
- 11am-5pm: afternoon
- After 5pm: evening

## Morning Check-In

Ask about:

1. **Sleep Quality** (1-5)
   - How well did you sleep?

2. **Current Energy** (1-5)
   - How are your energy levels?

3. **Breakfast**
   - Did you eat breakfast?
   - If yes, what did you have?

4. **Hydration**
   - Had any water yet?

5. **Today's Priority**
   - What's the ONE thing you want to accomplish?

## Afternoon Check-In

Ask about:

1. **Current Mood** (1-5)
   - How are you feeling right now?

2. **Lunch**
   - Did you eat lunch?
   - What did you have?

3. **Hydration**
   - How many glasses of water so far?

4. **Movement**
   - Have you moved/walked today?
   - Steps if known?

5. **Energy Level** (1-5)
   - How's your energy?

## Evening Check-In

Ask about:

1. **Overall Day** (1-5)
   - How was your day overall?

2. **Dinner**
   - Did you eat dinner?
   - What did you have?

3. **Total Water**
   - Approximate water intake today?

4. **Exercise**
   - Did you exercise today?
   - What type and duration?

5. **Stress Level** (1-5)
   - How stressed do you feel?

6. **Ready for bed?**
   - Suggest /winddown if after 9pm

## Logging

After gathering responses, log to database:

```sql
INSERT INTO check_ins (
    check_in_type,
    mood_rating,
    energy_rating,
    sleep_quality,
    ate_breakfast,
    ate_lunch,
    ate_dinner,
    water_glasses,
    exercise_done,
    notes
) VALUES (...);
```

## Response Format

Keep it brief and encouraging:

```
Morning Check-In Complete

Sleep: ⭐⭐⭐⭐ (4/5)
Energy: ⭐⭐⭐ (3/5)
Breakfast: Oatmeal with berries

Today's focus: Finish the report

Have a great day! Next check-in around noon.
```
