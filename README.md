# Hustle for Life

> **"You can't hustle if you're broken."**

Personal well-being agent powered by Claude Code. Track health metrics, build healthy habits, and get AI-powered insights—all on your own infrastructure.

## Features

### Health Tracking
- **Meals & Nutrition** - Log what you eat, when you eat
- **Hydration** - Water intake tracking with reminders
- **Vitals** - Blood pressure, blood sugar, heart rate
- **Sleep** - Bedtime, wake time, quality tracking
- **Activity** - Steps, exercise, movement
- **Weight** - Trend tracking over time

### Mental Wellness
- **Mood Check-ins** - Track emotional state
- **Stress Monitoring** - Identify patterns
- **Gratitude Journal** - Daily practice
- **Weekly Reflections** - Review and plan

### Smart Reminders (NTFY)
- Morning check-in
- Hydration nudges
- Meal logging prompts
- Wind-down ritual
- Medication reminders

### Privacy-First
- Self-hosted PostgreSQL on YOUR Proxmox server
- No cloud dependencies
- Full data ownership
- Local backups to your disks

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/hustle-for-life.git
cd hustle-for-life
```

### 2. Set up database (Proxmox)
```bash
cd docker/
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

### 3. Install cron reminders
```bash
./src/scripts/install-crons.sh
```

### 4. Subscribe to NTFY
Download the NTFY app and subscribe to your topic.

### 5. Start using
```bash
cd /path/to/hustle-for-life
claude
> /checkin
```

## Commands

| Command | Description |
|---------|-------------|
| `/meal [food]` | Log a meal |
| `/water [oz]` | Log water intake |
| `/mood [1-5]` | Log mood |
| `/bp [120/80]` | Log blood pressure |
| `/glucose [mg/dL]` | Log blood sugar |
| `/weight [lbs]` | Log weight |
| `/winddown` | End of day ritual |
| `/wakeup` | Morning check-in |
| `/checkin` | Full status check |
| `/summary` | Daily/weekly summary |

## Architecture

```
You (Claude Code) ──► PostgreSQL (Proxmox) ──► Your Disks (Backup)
        │
        ▼
   NTFY (Notifications) ──► Your Phone
```

## Version

**v1.0.0** - Initial Release

## License

MIT - Your health, your data, your code.
