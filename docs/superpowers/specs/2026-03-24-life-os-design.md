# Life OS — System Design Spec

**Date:** 2026-03-24
**Author:** CTO Agent + Alfonso Morales
**Status:** Approved

---

## Overview

Two-repo system for managing Alfonso's life through an AI-powered mobile app with GitHub as the versioned datastore.

**Repo 1: `life-os`** — Markdown + JSON knowledge base. GitHub is the database. Health data from iPhone committed back with full version history.

**Repo 2: `hustle-for-life`** (branch: `expo-react-native`) — Expo React Native app. Vercel AI SDK for AI. Claude Code as primary provider (always-on on CT 100). Supabase for structured data. HealthKit for native health integration.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  iPhone (Expo React Native)                      │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ AI Chat  │  │ Health   │  │ Life OS Hub  │    │
│  │ (useChat)│  │ Dashboard│  │ (all domains)│    │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │        HealthKit             │            │
│       │        (steps, HR,           │            │
│       │         sleep, BP,           │            │
│       │         glucose, weight)     │            │
│       │                              │            │
│  ┌────▼──────────────────────────────▼────────┐  │
│  │  DefaultChatTransport + expo/fetch          │  │
│  │  (streaming to backend)                     │  │
│  └────┬───────────────────────────────┬───────┘  │
└───────┼───────────────────────────────┼──────────┘
        │                               │
        ▼                               ▼
┌───────────────────────┐   ┌───────────────────────┐
│  CT 100 Backend        │   │  GitHub API            │
│  (Express + AI SDK)    │   │                        │
│                        │   │  life-os repo          │
│  Claude Code Provider  │   │  - health/data/*.json  │
│  (primary, always-on)  │   │  - routines/*.md       │
│  - Reads files         │   │  - finance/*.md        │
│  - Runs bash           │   │  - Full version history│
│  - Queries Supabase    │   └───────────────────────┘
│  - Writes to life-os   │
│                        │
│  AI Gateway Models:    │
│  - Claude Sonnet 4.6   │
│  - GPT 5.3             │
│  - Gemini 3.1          │
│                        │
│  Supabase (local)      │
│  - Conversations       │
│  - Health time-series  │
│  - User preferences    │
└───────────────────────┘
```

---

## AI Provider Configuration

### Primary: Claude Code Provider

Uses `ai-sdk-provider-claude-code` — connects to the always-on Claude Code CLI on CT 100. This is the full agentic Claude with file access, bash, MCP servers.

```typescript
import { createClaudeCode } from 'ai-sdk-provider-claude-code';

const claudeCode = createClaudeCode({
  defaultSettings: {
    permissionMode: 'bypassPermissions',
    cwd: '/home/dev',
    maxTurns: 15,
    systemPrompt: 'You are Alfonso\'s Life OS assistant. You have access to his full life knowledge base at /home/dev/hustle-os/ and can read health data, query Supabase, and manage his life domains.',
    settingSources: ['project'],
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',
  },
});
```

### Secondary: AI Gateway Models

For fast chat without tool use, or alternative perspectives:

| Provider | Model ID | Use Case |
|----------|----------|----------|
| Anthropic | `claude-sonnet-4-6` | Fast responses, no tool use |
| OpenAI | `gpt-5.3` | Second opinion, different style |
| Google | `gemini-3.1` | Multimodal, alternative perspective |

### Model Router

```typescript
// User selects model in settings, or app auto-routes:
// - Complex questions (needs file access) → Claude Code
// - Quick chat → AI Gateway (Claude Sonnet 4.6)
// - User preference → GPT 5.3 or Gemini 3.1
```

---

## Backend Architecture

Express server running on CT 100, always-on via systemd.

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/chat` | AI chat (streamText with selected provider) |
| POST | `/api/health/sync` | Receive HealthKit data from app |
| GET | `/api/health/summary` | Get health summary for date range |
| POST | `/api/life/commit` | Commit data to life-os GitHub repo |
| GET | `/api/life/read` | Read files from life-os |
| GET | `/api/models` | List available AI models |

### Always-On Claude Code

Systemd service ensures Claude Code CLI is authenticated and available. The `ai-sdk-provider-claude-code` spawns Claude processes as needed — it doesn't need a persistent process, just the CLI installed and authenticated.

```ini
# /etc/systemd/system/hustle-life-api.service
[Unit]
Description=Hustle for Life API Server
After=network.target

[Service]
Type=simple
User=dev
WorkingDirectory=/home/dev/repos/hustle-for-life
ExecStart=/usr/bin/node --import tsx/esm server/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=HOME=/home/dev
Environment=PATH=/home/dev/.local/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

---

## Data Layer

### Supabase (Hosted on CT 100)

Project: `fenhyfxbapybmddvhcei` (us-west-2)

**Tables:**

```sql
-- Health time-series (structured, queryable)
CREATE TABLE health_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'steps', 'heart_rate', 'sleep', 'bp', 'glucose', 'weight', 'meal', 'water', 'mood'
  value JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  source TEXT DEFAULT 'healthkit', -- 'healthkit', 'manual', 'app'
  synced_to_github BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations (chat history)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  model TEXT NOT NULL, -- which AI model was used
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences
CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### GitHub (life-os repo)

Health data committed daily as JSON:

```
life-os/
├── health/
│   ├── goals.md
│   └── data/
│       ├── 2026-03-24.json    # Daily health snapshot
│       ├── 2026-03-23.json
│       └── ...
├── finance/
│   ├── budget.md
│   └── subscriptions.md
├── learning/
│   └── goals.md
├── home/
│   └── automations.md
├── life-agent/
│   └── routines.md
├── mirror-factory/
│   └── overview.md
├── roi-amplified/
│   └── overview.md
└── me.md
```

**Daily health JSON format:**

```json
{
  "date": "2026-03-24",
  "steps": 12450,
  "heart_rate": { "resting": 62, "avg": 78, "max": 145 },
  "sleep": { "hours": 7.2, "deep_min": 48, "rem_min": 92, "quality": "good" },
  "blood_pressure": { "systolic": 118, "diastolic": 76 },
  "glucose": { "fasting": 92 },
  "weight": 185.4,
  "water_oz": 80,
  "meals": ["oatmeal + berries", "chicken salad", "salmon + rice"],
  "mood": { "morning": 4, "afternoon": 3, "evening": 4 },
  "synced_at": "2026-03-24T22:00:00Z"
}
```

---

## Mobile App Structure

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52+ (React Native) |
| Routing | Expo Router (file-based) |
| Styling | Tailwind CSS v4 + NativeWind v5 |
| AI | Vercel AI SDK v6 (`useChat`, `DefaultChatTransport`, `expo/fetch`) |
| Health | `@kingstinct/react-native-healthkit` |
| Dynamic Island | `expo-live-activity` |
| Action Button | `expo-ios-app-intents` (Swift integration) |
| Notifications | `expo-notifications` |
| Storage | `expo-secure-store` (tokens), `expo-sqlite` (offline cache) |
| State | React Query (TanStack Query) |
| HTTP | `expo/fetch` (streaming support) |

### App Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx           # Tab bar layout
│   ├── index.tsx             # Home / Life OS hub
│   ├── chat.tsx              # AI chat interface
│   ├── health.tsx            # Health dashboard
│   └── settings.tsx          # Settings & model selection
├── chat/
│   └── [id].tsx              # Individual conversation
├── health/
│   ├── log.tsx               # Manual health logging
│   └── trends.tsx            # Health trends & charts
├── _layout.tsx               # Root layout (providers)
├── +not-found.tsx
components/
├── chat/
│   ├── ChatBubble.tsx        # Message bubble
│   ├── ChatInput.tsx         # Input with voice/text
│   ├── ModelSelector.tsx     # Switch between AI models
│   └── StreamingText.tsx     # Animated streaming response
├── health/
│   ├── HealthCard.tsx        # Individual metric card
│   ├── HealthChart.tsx       # Trend chart (use-dom for recharts)
│   ├── HealthSync.tsx        # HealthKit sync status
│   └── MoodLogger.tsx        # Quick mood entry
├── life/
│   ├── DomainCard.tsx        # Life domain summary
│   └── QuickAction.tsx       # Quick action buttons
└── ui/                       # Shared UI components
lib/
├── ai/
│   ├── providers.ts          # AI provider configuration
│   ├── claude-code.ts        # Claude Code provider setup
│   └── gateway.ts            # AI Gateway models
├── health/
│   ├── healthkit.ts          # HealthKit integration
│   ├── sync.ts               # Sync to server + GitHub
│   └── types.ts              # Health data types
├── github/
│   └── commit.ts             # GitHub API (Octokit) for life-os commits
├── supabase/
│   └── client.ts             # Supabase client
└── utils/
    ├── api.ts                # generateAPIUrl helper
    └── storage.ts            # SecureStore helpers
server/
├── index.ts                  # Express server entry
├── routes/
│   ├── chat.ts               # AI chat endpoint
│   ├── health.ts             # Health data endpoints
│   └── life.ts               # Life-os read/write
└── lib/
    ├── claude-code.ts         # Claude Code provider config
    ├── gateway.ts             # AI Gateway config
    └── supabase.ts            # Supabase server client
```

---

## Native iOS Features

### HealthKit Integration

Read-only access to Apple Health. Custom dev client required (not Expo Go).

**Metrics synced:**
- Steps (daily total)
- Heart rate (resting, average, max)
- Sleep analysis (total, deep, REM, light)
- Blood pressure (systolic/diastolic)
- Blood glucose (fasting)
- Weight
- Active calories

**Sync schedule:**
- Background fetch every 6 hours
- Manual sync on app open
- Push to Supabase + GitHub on sync

### Dynamic Island / Live Activities

Show persistent health status:
- Current step count
- Next reminder (meal, water, check-in)
- AI thinking indicator (when Claude is processing)

### Action Button

iPhone 15 Pro / 16 — press Action Button to:
- Open quick chat with Claude
- Log a quick mood entry
- Start a check-in

Requires Swift App Intent via `expo-ios-app-intents`.

### Push Notifications

Server-triggered via `expo-notifications`:
- Morning check-in reminder (7am)
- Hydration reminders (every 2 hours)
- Evening wind-down (9pm)
- Health summary (10pm)
- AI insights when patterns detected

---

## Project Management

No Linear. All PM work lives in docs:

```
docs/
├── superpowers/
│   └── specs/
│       └── 2026-03-24-life-os-design.md  # THIS FILE
├── plans/
│   ├── sprint-001-foundation.md
│   ├── sprint-002-ai-chat.md
│   ├── sprint-003-health.md
│   └── sprint-004-native-features.md
├── logs/
│   └── YYYY-MM-DD-session.md             # PM session logs
├── tests/
│   └── test-results.md                   # Latest test runs
└── status.md                             # Current project status
```

PM agent manages plans, dispatches to dev agents via tmux, reports progress via Discord (Hustle Hub).

---

## Sprint Plan Overview

### Sprint 1: Foundation
- Expo project scaffold (Expo Router, Tailwind, NativeWind)
- Backend server (Express + Vercel AI SDK)
- Claude Code provider setup (always-on, systemd)
- Supabase tables + client
- CLAUDE.md + AGENTS.md with full docs index
- Basic navigation (tabs: Home, Chat, Health, Settings)

### Sprint 2: AI Chat
- Chat UI with `useChat` + `DefaultChatTransport` + `expo/fetch`
- Claude Code as primary model (streaming)
- Model selector (Claude, GPT, Gemini)
- Conversation persistence (Supabase)
- Departments context (life-agent, health, etc.)

### Sprint 3: Health
- HealthKit integration (`@kingstinct/react-native-healthkit`)
- Health dashboard with trend charts
- Manual logging (mood, meals, water)
- Sync to Supabase + GitHub (life-os repo)
- Background fetch for periodic sync

### Sprint 4: Native Features
- Dynamic Island (step count, reminders)
- Action Button (quick chat, mood log)
- Push notifications (reminders, insights)
- Custom dev client build for TestFlight

### Sprint 5: Life OS Hub
- All domains view (health, finance, routines, projects)
- Quick actions per domain
- GitHub integration (read/write life-os files)
- Web build for Mac desktop access

---

## Security

- API keys in environment variables only, never committed
- Expo SecureStore for tokens on device
- Supabase RLS policies for data access
- Claude Code `permissionMode: 'bypassPermissions'` (trusted server)
- GitHub API via personal access token (stored in server env)
- HTTPS everywhere (Cloudflare tunnel)

---

## Models (March 2026)

| Provider | Model | ID |
|----------|-------|----|
| Anthropic | Claude Sonnet 4.6 | `claude-sonnet-4-6` |
| OpenAI | GPT 5.3 | `gpt-5.3` |
| Google | Gemini 3.1 | `gemini-3.1` |

Claude Code provider uses the Claude Code CLI (authenticated via `claude login`), which uses your Claude Pro/Max subscription. AI Gateway models require API keys configured in the backend `.env`.
