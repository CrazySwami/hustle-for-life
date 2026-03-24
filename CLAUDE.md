# Hustle for Life — Expo React Native App

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning. Consult local docs and skill references before relying on training data.

> REMINDER: Push early, push often. Commit after each completed unit of work.

## Philosophy

**"You can't hustle if you're broken."**

AI-powered life management app — health tracking, AI coaching, and personal knowledge base with GitHub as the versioned datastore.

## Project Instructions

- **Stack**: Expo SDK 52+ (React Native), TypeScript, Tailwind CSS v4 + NativeWind v5
- **AI**: Vercel AI SDK v6, Claude Code Provider (primary), AI Gateway (Claude Sonnet 4.6, GPT 5.3, Gemini 3.1)
- **Backend**: Express.js on CT 100, always-on via systemd
- **Database**: Supabase (project `fenhyfxbapybmddvhcei`, us-west-2)
- **Data Store**: GitHub `life-os` repo (markdown + JSON, version history)
- **Health**: HealthKit via `@kingstinct/react-native-healthkit`
- **Package manager**: npm
- **Port**: Backend on 3500, accessible via Tailscale at `100.99.131.90:3500`
- **NEVER use port 3001**

## Skills

[Skills Index]
|IMPORTANT: When a skill is relevant, read its SKILL.md BEFORE writing code.

### Tier 1 — Core

|expo-app-design:building-ui|~/.claude/skills/expo-app-design/skills/building-ui
|  desc: Expo Router UI, navigation, native controls, animations
|  contains: SKILL.md, references/ (12 files)

|expo-app-design:tailwind-setup|~/.claude/skills/expo-app-design/skills/tailwind-setup
|  desc: Tailwind CSS v4 + NativeWind v5 in Expo
|  contains: SKILL.md

|expo-app-design:data-fetching|~/.claude/skills/expo-app-design/skills/data-fetching
|  desc: fetch, React Query, caching, offline, auth tokens
|  contains: SKILL.md

### Tier 2 — AI Integration

|vercel-ai-testing|~/.claude/skills/vercel-ai-testing
|  desc: Vercel AI SDK v6, model testing, AI Gateway
|  contains: SKILL.md

|react-best-practices|~/.claude/skills/react-best-practices
|  desc: React patterns, performance, code quality
|  contains: SKILL.md, AGENTS.md

### Tier 3 — Platform

|expo-app-design:dev-client|~/.claude/skills/expo-app-design/skills/dev-client
|  desc: Custom dev clients, TestFlight builds
|  contains: SKILL.md

|expo-app-design:api-routes|~/.claude/skills/expo-app-design/skills/api-routes
|  desc: Expo Router API routes, server-side logic
|  contains: SKILL.md

|expo-app-design:use-dom|~/.claude/skills/expo-app-design/skills/use-dom
|  desc: Web components in native (charts, syntax highlighting)
|  contains: SKILL.md

|ios-native|~/.claude/skills/ios-native
|  desc: Swift/SwiftUI, Dynamic Island, HealthKit, App Intents
|  contains: SKILL.md

### Tier 4 — Deployment

|expo-deployment:deployment|~/.claude/skills/expo-deployment/skills/deployment
|  desc: App Store, Play Store, web, TestFlight
|  contains: SKILL.md, references/ (5 files)

|expo-deployment:cicd-workflows|~/.claude/skills/expo-deployment/skills/cicd-workflows
|  desc: EAS workflow YAML, CI/CD automation
|  contains: SKILL.md

### Tier 5 — Maintenance

|upgrading-expo|~/.claude/skills/upgrading-expo
|  desc: SDK upgrades, React 19, New Architecture
|  contains: SKILL.md, references/ (3 files)

## Documentation

### AI SDK Docs (Local)
Full Vercel AI SDK documentation at `./docs/ai-sdk/`:
- Getting started with Expo: `02-getting-started/07-expo.mdx`
- useChat hook: `04-ai-sdk-ui/02-chatbot.mdx`
- Transport layer: `04-ai-sdk-ui/21-transport.mdx`
- Streaming: `02-foundations/05-streaming.mdx`
- Agents: `03-agents/`
- Full reference: `07-reference/`

### AI Gateway Docs (Local)
`./docs/ai-gateway/` — model routing, providers, fallbacks

### AI Elements Docs (Local)
`./docs/ai-elements/` — UI component reference (web-only, for reference)

### Design Spec
`./docs/superpowers/specs/2026-03-24-life-os-design.md` — full system architecture

## Critical Paths

- `app/(tabs)/` — Main tab navigation (Home, Chat, Health, Settings)
- `app/(tabs)/chat.tsx` — AI chat with useChat hook
- `server/index.ts` — Backend Express server
- `server/routes/chat.ts` — AI streaming endpoint (Claude Code + Gateway)
- `lib/ai/claude-code.ts` — Claude Code provider config
- `lib/ai/gateway.ts` — AI Gateway models config
- `lib/health/healthkit.ts` — HealthKit integration
- `lib/github/commit.ts` — GitHub API for life-os commits
- `departments/` — Agent context modules (life-agent, health, etc.)

## AI Provider Setup

### Claude Code (Primary)
```typescript
import { createClaudeCode } from 'ai-sdk-provider-claude-code';

const claudeCode = createClaudeCode({
  defaultSettings: {
    permissionMode: 'bypassPermissions',
    cwd: '/home/dev',
    maxTurns: 15,
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',
    settingSources: ['project'],
  },
});
// Use: claudeCode('sonnet') → Claude Sonnet 4.6
```

### AI Gateway (Secondary)
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

// Claude Sonnet 4.6 (fast, no tool use)
anthropic('claude-sonnet-4-6')

// GPT 5.3
openai('gpt-5.3')

// Gemini 3.1
google('gemini-3.1')
```

### Expo Client (useChat)
```typescript
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';

const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: 'https://100.99.131.90:3500/api/chat',
  }),
});
```

## Project Management

No Linear. All managed in `docs/`:
- `docs/plans/` — Sprint plans
- `docs/logs/` — Session logs
- `docs/tests/` — Test results
- `docs/status.md` — Current status

PM agent manages these, reports via Discord (Hustle Hub).

## Infrastructure

| Property | Value |
|----------|-------|
| Server | CT 100 (hustle-dev) on Proxmox |
| Backend Port | 3500 |
| Tailscale | 100.99.131.90 |
| Supabase | fenhyfxbapybmddvhcei (us-west-2) |
| GitHub | CrazySwami/hustle-for-life (branch: expo-react-native) |
| life-os repo | GitHub (TBD — needs to be created) |
