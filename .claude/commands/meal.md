---
description: Log a meal with description and optional details
argument-hint: <description> [calories] [meal_type]
---

# Log Meal

Log a meal to the database.

## Input

$ARGUMENTS

## Process

1. Parse the input:
   - First argument: meal description (required)
   - Optional: calories, meal type (breakfast/lunch/dinner/snack)

2. Determine meal type if not specified:
   - Before 10am: breakfast
   - 10am-2pm: lunch
   - 2pm-5pm: snack
   - After 5pm: dinner

3. Get current timestamp

4. Log to database (when connected):
```sql
INSERT INTO meals (meal_time, meal_type, description, calories)
VALUES (NOW(), '[type]', '[description]', [calories]);
```

5. Confirm logging with a brief response

## Example Outputs

**Input:** `/meal Oatmeal with berries and honey`
**Output:**
```
Logged: Breakfast
Oatmeal with berries and honey
Time: 8:30 AM
```

**Input:** `/meal Grilled chicken salad 450`
**Output:**
```
Logged: Lunch
Grilled chicken salad (450 cal)
Time: 12:45 PM
```

## Quick Tips

- Be descriptive for better tracking
- Estimate portions when unsure
- Log snacks too, they count!
