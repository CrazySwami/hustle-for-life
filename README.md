# Hustle for Life

> **"You can't hustle if you're broken."**

AI-powered life management app built with Expo (React Native), Vercel AI SDK, and Claude Code.

## What It Does

- **AI Chat** — Talk to Claude (with full server access), GPT 5.3, or Gemini 3.1
- **Health Tracking** — HealthKit integration, auto-sync to GitHub as versioned data
- **Life OS Hub** — Manage health, finance, routines, projects from one app
- **Dynamic Island** — Live health status on your Lock Screen
- **Action Button** — Quick access to Claude from anywhere on iPhone

## Architecture

```
iPhone (Expo)  →  Backend (CT 100)  →  Claude Code (always-on)
                                    →  Supabase (structured data)
                                    →  GitHub life-os (versioned data)
```

## Stack

- **App**: Expo SDK 52+, React Native, TypeScript, Tailwind CSS v4
- **AI**: Vercel AI SDK v6, Claude Code Provider, AI Gateway
- **Backend**: Express.js, Node.js 20+
- **Database**: Supabase (PostgreSQL)
- **Health**: HealthKit via @kingstinct/react-native-healthkit
- **Native**: Dynamic Island, Action Button, Push Notifications

## Getting Started

```bash
# App
npm install
npx expo start

# Backend
cd server
npm install
node --import tsx/esm index.ts
```

## Docs

- [Design Spec](docs/superpowers/specs/2026-03-24-life-os-design.md)
- [AI SDK Docs](docs/ai-sdk/)
- [AI Gateway Docs](docs/ai-gateway/)
- [Sprint Status](docs/status.md)

## Branch

This is the `expo-react-native` branch — a complete rewrite from the original Swift/Node architecture to Expo + Vercel AI SDK.

## License

MIT — Your life, your data, your code.
