# Hustle for Life - Personal Well-Being Agent

Your AI-powered well-being companion that tracks health metrics, encourages healthy habits, and helps you live better.

## Philosophy

**"You can't hustle if you're broken."**

This agent helps you maintain the foundation that makes everything else possible:
- Sleep
- Nutrition
- Movement
- Mental clarity
- Social connection

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HUSTLE FOR LIFE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Check-In  │  │    Track    │  │   Analyze   │             │
│  │    Agent    │  │    Agent    │  │    Agent    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL (Proxmox)                   │   │
│  │  meals | vitals | sleep | mood | activity | hydration   │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NTFY Notifications                    │   │
│  │         Check-ins | Reminders | Insights                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tracking Categories

### Physical Health
| Metric | Frequency | Input Method |
|--------|-----------|--------------|
| **Meals** | 3x/day | `/meal` command |
| **Water** | Ongoing | `/water` command |
| **Blood Sugar** | As needed | `/glucose` command |
| **Blood Pressure** | Daily | `/bp` command |
| **Weight** | Weekly | `/weight` command |
| **Steps/Activity** | Daily | Apple Health import |
| **Medications** | As scheduled | Reminders |

### Sleep
| Metric | Frequency | Input Method |
|--------|-----------|--------------|
| **Bedtime** | Daily | `/winddown` command |
| **Wake time** | Daily | `/wakeup` command |
| **Sleep quality** | Daily | 1-5 rating |
| **Sleep duration** | Calculated | Auto |

### Mental Health
| Metric | Frequency | Input Method |
|--------|-----------|--------------|
| **Mood** | 2-3x/day | `/mood` command |
| **Stress level** | As needed | `/stress` command |
| **Gratitude** | Daily | `/grateful` command |
| **Weekly reflection** | Weekly | `/reflect` command |

### Productivity
| Metric | Frequency | Input Method |
|--------|-----------|--------------|
| **Focus sessions** | As needed | `/focus` command |
| **Breaks taken** | Tracked | Reminders |
| **Screen time** | Daily | System data |

## Available Commands

### Quick Logging
```
/meal [description]      # Log what you ate
/water [amount]          # Log water intake
/glucose [level]         # Log blood sugar
/bp [systolic/diastolic] # Log blood pressure
/weight [kg or lbs]      # Log weight
/mood [1-5] [notes]      # Log mood
/steps [count]           # Log steps (or import)
```

### Check-ins
```
/checkin                 # Full check-in prompt
/winddown                # End of day ritual
/wakeup                  # Morning check-in
/reflect                 # Weekly reflection
```

### Analysis
```
/summary [today|week|month]  # Health summary
/trends [metric]             # Trend analysis
/insights                    # AI-generated insights
```

### Utilities
```
/remind [time] [message]     # Set reminder
/export [format]             # Export data
/goals                       # View/set goals
```

## Notification Schedule

### Daily Reminders (via NTFY)
| Time | Reminder |
|------|----------|
| 7:00 AM | Morning check-in |
| 9:00 AM | Hydration reminder |
| 12:00 PM | Lunch check-in |
| 3:00 PM | Afternoon hydration |
| 6:00 PM | Dinner check-in |
| 9:00 PM | Evening wind-down prep |
| 10:00 PM | Wind-down reminder |
| 10:30 PM | Bedtime (target) |

### Periodic Reminders
| Interval | Reminder |
|----------|----------|
| Every 2 hours | Hydration nudge |
| Every 20 min (focus) | Eye strain break |
| Every hour (desk) | Posture check |

## Database Schema

Self-hosted PostgreSQL on Proxmox. See `docker/docker-compose.yml` for setup.

### Core Tables
- `meals` - Food logging with timestamps
- `hydration` - Water intake
- `vitals` - BP, glucose, heart rate
- `sleep` - Sleep sessions
- `mood` - Mood check-ins
- `activity` - Steps, exercise
- `medications` - Med tracking
- `reflections` - Journal entries

## Setup

### 1. Database (Proxmox)
```bash
cd docker/
docker-compose up -d
```

### 2. Environment
```bash
cp .env.example .env
# Edit with your Proxmox PostgreSQL connection
```

### 3. Cron Jobs
```bash
./src/scripts/install-crons.sh
```

### 4. NTFY Topic
Subscribe to `hustle-life-[your-id]` in the NTFY app.

## Privacy

All data stays on YOUR infrastructure:
- PostgreSQL runs on YOUR Proxmox server
- No cloud services required
- Backups to YOUR disks
- Full data ownership

## File Structure

```
hustle-for-life/
├── CLAUDE.md              # This file
├── .claude/
│   ├── agents/            # Specialized agents
│   │   ├── check-in/      # Periodic check-ins
│   │   ├── tracker/       # Data logging
│   │   ├── analyzer/      # Trend analysis
│   │   └── coach/         # Health coaching
│   ├── commands/          # Slash commands
│   │   ├── meal.md
│   │   ├── water.md
│   │   ├── mood.md
│   │   ├── winddown.md
│   │   └── ...
│   └── skills/            # Auto-invoked skills
├── src/
│   ├── lib/               # Shared utilities
│   │   ├── db.ts          # Database connection
│   │   └── ntfy.ts        # Notification helpers
│   └── scripts/           # Cron scripts
│       ├── morning-checkin.sh
│       ├── hydration-reminder.sh
│       └── install-crons.sh
├── docker/
│   ├── docker-compose.yml # PostgreSQL setup
│   └── init.sql           # Schema
└── docs/
    └── api/               # API documentation
```

## Goals & Targets

### Sleep
- **Target bedtime:** 10:30 PM
- **Target wake time:** 6:30 AM
- **Target duration:** 8 hours

### Hydration
- **Daily target:** 8 glasses (64 oz / 2L)
- **Reminder frequency:** Every 2 hours

### Activity
- **Daily steps:** 10,000
- **Exercise:** 30 min, 5x/week

### Nutrition
- **Meals:** 3 balanced meals
- **Log accuracy:** 80%+ days logged

## Integration Points

### Potential Imports
- Apple Health (steps, heart rate, sleep)
- Fitbit API
- Oura Ring
- Withings (weight, BP)
- CGM apps (glucose)

### Exports
- CSV for spreadsheet analysis
- JSON for backup
- Markdown summaries

## Version

**v1.0.0** - Initial release

Features:
- Core tracking commands
- NTFY notification system
- PostgreSQL self-hosted database
- Sleep/wind-down system
- Basic check-in agents
