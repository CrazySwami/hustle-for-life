# Sprint 1: Foundation + Dev Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo app with all native modules, build a custom dev client, set up the Express backend with Claude Code provider, and get AI chat streaming on a physical iPhone.

**Architecture:** Expo SDK 52+ app with file-based routing connects to Express backend on CT 100 via Tailscale. Backend uses Vercel AI SDK with Claude Code provider (primary) and AI Gateway models. Custom dev client includes all native modules (HealthKit, notifications, Dynamic Island, biometrics, haptics) so we only build once and iterate via QR code after.

**Tech Stack:** Expo SDK 52+, TypeScript, Tailwind CSS v4 + NativeWind v5, Vercel AI SDK v6, Express.js, ai-sdk-provider-claude-code, expo-notifications, expo-secure-store, expo-local-authentication, expo-haptics, @kingstinct/react-native-healthkit, expo-live-activity

**Spec:** `docs/superpowers/specs/2026-03-24-life-os-design.md`

**Skills to read before starting:**
- `@expo-app-design:building-ui` — Expo Router, navigation, native controls
- `@expo-app-design:tailwind-setup` — Tailwind v4 + NativeWind v5
- `@expo-app-design:dev-client` — Custom dev builds, TestFlight
- `@vercel-ai-testing` — AI SDK v6, model testing
- AI SDK Expo docs: `docs/ai-sdk/02-getting-started/07-expo.mdx`

---

## File Structure

### App (Expo)

```
app.json                          # Expo config with all native plugins
tsconfig.json                     # TypeScript config
tailwind.config.js                # Tailwind v4 config (if needed)
global.css                        # Tailwind imports + platform fonts
metro.config.js                   # Metro with NativeWind
eas.json                          # EAS build profiles (dev, preview, prod)
app/
├── _layout.tsx                   # Root layout (providers: QueryClient, etc.)
├── (tabs)/
│   ├── _layout.tsx               # Tab bar with 4 tabs
│   ├── index.tsx                 # Home screen (placeholder)
│   ├── chat.tsx                  # AI chat screen
│   ├── health.tsx                # Health screen (placeholder)
│   └── settings.tsx              # Settings screen
├── +not-found.tsx                # 404 screen
components/
├── chat/
│   ├── ChatBubble.tsx            # Single message bubble
│   ├── ChatInput.tsx             # Text input + send button
│   └── ModelSelector.tsx         # Model picker dropdown
├── ui/
│   ├── View.tsx                  # Tailwind-wrapped View
│   ├── Text.tsx                  # Tailwind-wrapped Text
│   ├── ScrollView.tsx            # Tailwind-wrapped ScrollView
│   ├── Pressable.tsx             # Tailwind-wrapped Pressable
│   └── TextInput.tsx             # Tailwind-wrapped TextInput
lib/
├── ai/
│   └── providers.ts              # Model list + generateAPIUrl
├── utils/
│   └── api.ts                    # generateAPIUrl helper
```

### Backend (Express on CT 100)

```
server/
├── index.ts                      # Express entry point
├── routes/
│   └── chat.ts                   # POST /api/chat (streamText)
├── lib/
│   ├── claude-code.ts            # Claude Code provider config
│   ├── gateway.ts                # AI Gateway provider configs
│   └── auth.ts                   # API key validation middleware
├── package.json                  # Backend dependencies
├── tsconfig.json                 # Backend TS config
└── .env                          # API keys (gitignored)
```

---

## Task 1: Scaffold Expo Project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `.gitignore` (update)
- Skill: `@expo-app-design:building-ui`

- [ ] **Step 1: Create Expo project in the repo root**

```bash
cd /home/dev/repos/hustle-for-life
npx create-expo-app@latest . --template blank-typescript --yes
```

If it complains about existing files, we may need to init in a temp dir and move files. Adapt as needed — the goal is a working `app.json` + `package.json` + `tsconfig.json` in the repo root.

- [ ] **Step 2: Verify it runs**

```bash
npx expo start --web
```

Expected: Metro bundler starts, web build opens in browser.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project (blank TypeScript template)"
```

---

## Task 2: Install All Native Modules

**Files:**
- Modify: `package.json`, `app.json`
- Skill: `@expo-app-design:building-ui`, `@expo-app-design:dev-client`

We install everything now so the dev client build includes all native modules. After this one build, Alfonso iterates via QR code.

- [ ] **Step 1: Install core dependencies**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-font expo-splash-screen expo-system-ui
```

- [ ] **Step 2: Install AI SDK dependencies**

```bash
npm install ai @ai-sdk/react @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google
npm install ai-sdk-provider-claude-code
```

- [ ] **Step 3: Install native modules (all at once)**

```bash
npx expo install expo-notifications expo-secure-store expo-local-authentication
npx expo install expo-haptics expo-camera expo-speech expo-av
npx expo install expo-background-fetch expo-task-manager
npx expo install expo-sqlite expo-file-system expo-sharing
npx expo install @kingstinct/react-native-healthkit
```

- [ ] **Step 4: Install Dynamic Island support**

```bash
npm install expo-live-activity
```

Note: This may need `@bacons/apple-targets` as well. Check if expo-live-activity has a config plugin. If not:

```bash
npm install @bacons/apple-targets
```

- [ ] **Step 5: Install styling dependencies**

```bash
npm install nativewind@5.0.0-preview.2 tailwindcss@^4 react-native-css
npm install react-native-reanimated react-native-gesture-handler
```

- [ ] **Step 6: Install polyfills for AI SDK streaming**

```bash
npm install @ungap/structured-clone @stardazed/streams-text-encoding
```

- [ ] **Step 7: Install dev/utility packages**

```bash
npm install @tanstack/react-query
npx expo install expo-dev-client
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: install all native modules and AI SDK dependencies"
```

---

## Task 3: Configure app.json with All Plugins

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Update app.json with full config**

```json
{
  "expo": {
    "name": "Hustle for Life",
    "slug": "hustle-for-life",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "hustleforlife",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hustleforlife.app",
      "infoPlist": {
        "NSHealthShareUsageDescription": "Hustle for Life reads your health data to track fitness, sleep, and vitals.",
        "NSHealthUpdateUsageDescription": "Hustle for Life saves health entries you log.",
        "NSFaceIDUsageDescription": "Use Face ID to secure the app.",
        "NSCameraUsageDescription": "Camera access for quick captures.",
        "NSMicrophoneUsageDescription": "Microphone for voice input to Claude.",
        "UIBackgroundModes": ["fetch", "processing", "remote-notification"]
      },
      "entitlements": {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.healthkit.access": ["health-records"],
        "aps-environment": "development"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0d1117"
      },
      "package": "com.hustleforlife.app"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-notifications",
      ["expo-local-authentication", {
        "faceIDPermission": "Use Face ID to unlock Hustle for Life"
      }],
      ["expo-camera", {
        "cameraPermission": "Camera for quick captures"
      }],
      "expo-haptics",
      "expo-background-fetch",
      "expo-task-manager",
      "expo-speech",
      ["@kingstinct/react-native-healthkit", {
        "NSHealthShareUsageDescription": "Read health data for tracking",
        "NSHealthUpdateUsageDescription": "Save logged health entries"
      }],
      "expo-dev-client"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Verify config is valid**

```bash
npx expo config --type public
```

Expected: JSON output with all plugins listed, no errors.

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "feat: configure app.json with all native plugins"
```

---

## Task 4: Set Up Tailwind CSS v4 + NativeWind v5

**Files:**
- Create: `global.css`, `metro.config.js`, `postcss.config.mjs`, `components/ui/*.tsx`
- Skill: `@expo-app-design:tailwind-setup` — READ THIS FIRST

- [ ] **Step 1: Read the tailwind-setup skill**

```bash
cat ~/.claude/skills/expo-app-design/skills/tailwind-setup/SKILL.md
```

Follow its exact instructions for Tailwind v4 + NativeWind v5.

- [ ] **Step 2: Create postcss.config.mjs**

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 3: Create metro.config.js**

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind");

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  input: "./global.css",
  inlineVariables: false,
});
```

- [ ] **Step 4: Create global.css**

```css
@import "tailwindcss";

@theme {
  --font-sans: "System", -apple-system, BlinkMacSystemFont, sans-serif;
  --color-background: #0d1117;
  --color-surface: #161b22;
  --color-border: #30363d;
  --color-text: #e6edf3;
  --color-text-muted: #8b949e;
  --color-accent: #58a6ff;
  --color-green: #3fb950;
  --color-orange: #d29922;
  --color-red: #f85149;
}

@media ios {
  @theme {
    --font-sans: "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
  }
}
```

- [ ] **Step 5: Create CSS component wrappers**

Create `components/ui/View.tsx`:
```typescript
import { View as RNView, type ViewProps } from 'react-native';
import { useCssElement } from 'react-native-css';

export const View = useCssElement<ViewProps>(RNView);
```

Create `components/ui/Text.tsx`:
```typescript
import { Text as RNText, type TextProps } from 'react-native';
import { useCssElement } from 'react-native-css';

export const Text = useCssElement<TextProps>(RNText);
```

Create `components/ui/ScrollView.tsx`:
```typescript
import { ScrollView as RNScrollView, type ScrollViewProps } from 'react-native';
import { useCssElement } from 'react-native-css';

export const ScrollView = useCssElement<ScrollViewProps>(RNScrollView);
```

Create `components/ui/Pressable.tsx`:
```typescript
import { Pressable as RNPressable, type PressableProps } from 'react-native';
import { useCssElement } from 'react-native-css';

export const Pressable = useCssElement<PressableProps>(RNPressable);
```

Create `components/ui/TextInput.tsx`:
```typescript
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { useCssElement } from 'react-native-css';

export const TextInput = useCssElement<TextInputProps>(RNTextInput);
```

Create `components/ui/index.ts`:
```typescript
export { View } from './View';
export { Text } from './Text';
export { ScrollView } from './ScrollView';
export { Pressable } from './Pressable';
export { TextInput } from './TextInput';
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind CSS v4 + NativeWind v5"
```

---

## Task 5: Set Up Expo Router with Tab Navigation

**Files:**
- Create: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/chat.tsx`, `app/(tabs)/health.tsx`, `app/(tabs)/settings.tsx`, `app/+not-found.tsx`
- Skill: `@expo-app-design:building-ui` (tabs, navigation)

- [ ] **Step 1: Create root layout with providers**

Create `app/_layout.tsx`:
```typescript
import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create tab layout**

Create `app/(tabs)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#58a6ff',
        tabBarInactiveTintColor: '#8b949e',
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
        },
        headerStyle: {
          backgroundColor: '#0d1117',
        },
        headerTintColor: '#e6edf3',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="house" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <TabIcon name="message" color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  // Simple text icon — replace with SF Symbols or expo-symbols later
  const icons: Record<string, string> = {
    house: '🏠',
    message: '💬',
    heart: '❤️',
    gear: '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, color }}>{icons[name] || '•'}</Text>
  );
}

import { Text } from 'react-native';
```

- [ ] **Step 3: Create tab screens (placeholders + chat)**

Create `app/(tabs)/index.tsx`:
```typescript
import { View, Text, ScrollView } from '../../components/ui';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-3xl font-bold text-text">Hustle for Life</Text>
        <Text className="text-text-muted mt-2">You can't hustle if you're broken.</Text>
      </View>
    </ScrollView>
  );
}
```

Create `app/(tabs)/health.tsx`:
```typescript
import { View, Text, ScrollView } from '../../components/ui';

export default function HealthScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-2xl font-bold text-text">Health</Text>
        <Text className="text-text-muted mt-2">HealthKit integration coming soon.</Text>
      </View>
    </ScrollView>
  );
}
```

Create `app/(tabs)/settings.tsx`:
```typescript
import { View, Text, ScrollView } from '../../components/ui';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-2xl font-bold text-text">Settings</Text>
        <Text className="text-text-muted mt-2">Model selection and preferences.</Text>
      </View>
    </ScrollView>
  );
}
```

Create `app/+not-found.tsx`:
```typescript
import { Link, Stack } from 'expo-router';
import { View, Text } from '../components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text text-xl">Page not found.</Text>
        <Link href="/" className="mt-4">
          <Text className="text-accent">Go home</Text>
        </Link>
      </View>
    </>
  );
}
```

- [ ] **Step 4: Test on web**

```bash
npx expo start --web
```

Expected: 4-tab app renders with Home, Chat, Health, Settings tabs. Dark theme.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tab navigation with Home, Chat, Health, Settings"
```

---

## Task 6: Set Up Backend Server

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/index.ts`, `server/routes/chat.ts`, `server/lib/claude-code.ts`, `server/lib/gateway.ts`, `server/lib/auth.ts`, `server/.env`, `server/.env.example`

- [ ] **Step 1: Initialize backend**

```bash
mkdir -p server/routes server/lib
cd server
cat > package.json << 'EOF'
{
  "name": "hustle-life-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "node --import tsx/esm index.ts"
  },
  "dependencies": {
    "ai": "latest",
    "ai-sdk-provider-claude-code": "latest",
    "@ai-sdk/anthropic": "latest",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/google": "latest",
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
EOF
npm install
cd ..
```

- [ ] **Step 2: Create server/.env.example and server/.env**

```bash
cat > server/.env.example << 'EOF'
# API Auth
API_KEY=generate-a-random-key-here

# AI Provider Keys (for AI Gateway models)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Server
PORT=3500
EOF

cat > server/.env << 'EOF'
API_KEY=hustle-life-dev-key-2026
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
PORT=3500
EOF
```

- [ ] **Step 3: Create server/lib/auth.ts**

```typescript
import type { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
```

- [ ] **Step 4: Create server/lib/claude-code.ts**

```typescript
import { createClaudeCode } from 'ai-sdk-provider-claude-code';

export const claudeCode = createClaudeCode({
  defaultSettings: {
    permissionMode: 'bypassPermissions',
    cwd: '/home/dev',
    maxTurns: 15,
    systemPrompt: `You are Alfonso's Life OS assistant. You have access to his full life knowledge base at /home/dev/hustle-os/ and can read health data, query Supabase, and manage his life domains. Be concise and helpful.`,
    settingSources: ['project'],
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',
  },
});
```

- [ ] **Step 5: Create server/lib/gateway.ts**

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export const models = {
  'claude-code': null, // handled separately via claude-code provider
  'claude-sonnet': () => anthropic('claude-sonnet-4-6'),
  'gpt-5.3': () => openai('gpt-5.3'),
  'gemini-3.1': () => google('gemini-3.1'),
} as const;

export type ModelId = keyof typeof models;

export function getModelList() {
  return [
    { id: 'claude-code', name: 'Claude Code (Full Agent)', provider: 'anthropic', primary: true },
    { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', provider: 'anthropic' },
    { id: 'gpt-5.3', name: 'GPT 5.3', provider: 'openai' },
    { id: 'gemini-3.1', name: 'Gemini 3.1', provider: 'google' },
  ];
}
```

- [ ] **Step 6: Create server/routes/chat.ts**

```typescript
import { Router } from 'express';
import { streamText } from 'ai';
import { claudeCode } from '../lib/claude-code.js';
import { models, type ModelId } from '../lib/gateway.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, model: modelId = 'claude-code' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    let model;
    if (modelId === 'claude-code') {
      model = claudeCode('sonnet');
    } else if (modelId in models && modelId !== 'claude-code') {
      const factory = models[modelId as ModelId];
      if (factory) model = factory();
    }

    if (!model) {
      res.status(400).json({ error: `Unknown model: ${modelId}` });
      return;
    }

    const result = streamText({
      model,
      messages,
    });

    // Set headers for Expo streaming
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Encoding', 'none');

    // Pipe the AI SDK stream to the response
    result.pipeDataStreamToResponse(res);
  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

- [ ] **Step 7: Create server/index.ts**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './lib/auth.js';
import chatRouter from './routes/chat.js';
import { getModelList } from './lib/gateway.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3500');

app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Model list (no auth)
app.get('/api/models', (_req, res) => {
  res.json({ models: getModelList() });
});

// Protected routes
app.use('/api', authMiddleware);
app.use('/api', chatRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`);
  console.log(`[server] Tailscale: http://100.99.131.90:${PORT}`);
});
```

- [ ] **Step 8: Test the backend**

```bash
cd server && npm run dev &
sleep 3
curl http://localhost:3500/health
curl http://localhost:3500/api/models
curl -X POST http://localhost:3500/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hustle-life-dev-key-2026" \
  -d '{"messages":[{"role":"user","content":"Say hello in 5 words"}],"model":"claude-code"}'
```

Expected: Health returns `{"status":"ok"}`, models returns list, chat streams text.

- [ ] **Step 9: Commit**

```bash
cd /home/dev/repos/hustle-for-life
git add server/
git commit -m "feat: add Express backend with Claude Code + AI Gateway providers"
```

---

## Task 7: Wire Up Chat Screen to Backend

**Files:**
- Create: `lib/utils/api.ts`, `app/(tabs)/chat.tsx` (rewrite), `components/chat/ChatBubble.tsx`, `components/chat/ChatInput.tsx`
- Skill: Read `docs/ai-sdk/02-getting-started/07-expo.mdx` and `docs/ai-sdk/04-ai-sdk-ui/02-chatbot.mdx`

- [ ] **Step 1: Create API URL helper**

Create `lib/utils/api.ts`:
```typescript
import { Platform } from 'react-native';

const DEV_SERVER = 'http://100.99.131.90:3500';

export function generateAPIUrl(path: string): string {
  if (Platform.OS === 'web') {
    return DEV_SERVER + path;
  }
  // On device, always use Tailscale IP
  return DEV_SERVER + path;
}

export const API_KEY = 'hustle-life-dev-key-2026'; // TODO: move to SecureStore
```

- [ ] **Step 2: Create ChatBubble component**

Create `components/chat/ChatBubble.tsx`:
```typescript
import { View, Text } from '../ui';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text?: string }>;
}

export function ChatBubble({ role, parts }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser ? 'bg-accent' : 'bg-surface'
        }`}
      >
        {parts.map((part, i) => {
          if (part.type === 'text' && part.text) {
            return (
              <Text
                key={i}
                className={`text-base ${isUser ? 'text-white' : 'text-text'}`}
              >
                {part.text}
              </Text>
            );
          }
          return null;
        })}
      </View>
      <Text className="text-xs text-text-muted mt-1 px-1">
        {isUser ? 'You' : 'Claude'}
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Create ChatInput component**

Create `components/chat/ChatInput.tsx`:
```typescript
import { useState } from 'react';
import { View, TextInput, Pressable, Text } from '../ui';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(input.trim());
    setInput('');
  };

  return (
    <View className="flex-row items-end p-3 border-t border-border bg-surface">
      <TextInput
        className="flex-1 bg-background text-text rounded-2xl px-4 py-3 mr-2 text-base"
        placeholder="Ask Claude anything..."
        placeholderTextColor="#8b949e"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={handleSend}
        multiline
        maxLength={4000}
        editable={!disabled}
      />
      <Pressable
        className={`rounded-full w-10 h-10 items-center justify-center ${
          input.trim() && !disabled ? 'bg-accent' : 'bg-border'
        }`}
        onPress={handleSend}
        disabled={!input.trim() || disabled}
      >
        <Text className="text-white text-lg">↑</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Rewrite chat screen with useChat**

Rewrite `app/(tabs)/chat.tsx`:
```typescript
import { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { KeyboardAvoidingView, Platform, ScrollView as RNScrollView } from 'react-native';
import { View, Text, ScrollView } from '../../components/ui';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { generateAPIUrl, API_KEY } from '../../lib/utils/api';

export default function ChatScreen() {
  const scrollRef = useRef<RNScrollView>(null);

  const { messages, error, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }),
    onError: (err) => console.error('[chat]', err),
  });

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        {messages.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-4">💬</Text>
            <Text className="text-text-muted text-center text-lg">
              Talk to Claude.{'\n'}He has access to your server.
            </Text>
          </View>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} parts={m.parts} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <View className="items-start mb-3">
            <View className="bg-surface rounded-2xl px-4 py-3">
              <Text className="text-text-muted">Thinking...</Text>
            </View>
          </View>
        )}
        {error && (
          <View className="bg-red/10 rounded-xl p-3 mb-3">
            <Text className="text-red">{error.message}</Text>
          </View>
        )}
      </ScrollView>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 5: Test chat on web**

Start backend and Expo:
```bash
cd /home/dev/repos/hustle-for-life/server && npm run dev &
cd /home/dev/repos/hustle-for-life && npx expo start --web
```

Navigate to Chat tab, type a message, verify streaming response from Claude.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire up AI chat with useChat, Claude Code streaming"
```

---

## Task 8: EAS Setup + Build Custom Dev Client

**Files:**
- Create: `eas.json`
- Skill: `@expo-app-design:dev-client`

**PREREQUISITE:** Alfonso needs an Apple Developer account. If not ready yet, skip this task and use web + Expo Go for non-native features.

- [ ] **Step 1: Login to EAS**

```bash
npx eas login
```

- [ ] **Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "",
        "ascAppId": "",
        "appleTeamId": ""
      }
    }
  }
}
```

- [ ] **Step 3: Configure EAS project**

```bash
npx eas build:configure
```

- [ ] **Step 4: Build dev client for iOS device**

```bash
npx eas build --profile development --platform ios
```

This builds in the cloud. Takes ~15 min. Includes ALL native modules we installed in Task 2.

- [ ] **Step 5: Install on iPhone**

After build completes, EAS gives you a QR code or download link. Scan it on your iPhone to install the dev client.

- [ ] **Step 6: Connect to dev server**

On your Mac/server:
```bash
npx expo start --dev-client
```

Scan the QR code on your iPhone. The custom dev client connects to the Metro bundler and loads the app — with full native module access.

- [ ] **Step 7: Verify chat works on device**

Open Chat tab, send a message, verify Claude responds with streaming text on your physical iPhone.

- [ ] **Step 8: Commit**

```bash
git add eas.json
git commit -m "feat: add EAS config, build custom dev client"
```

---

## Task 9: Install Backend as systemd Service

**Files:**
- Create: `/etc/systemd/system/hustle-life-api.service`

- [ ] **Step 1: Create systemd service**

```bash
sudo tee /etc/systemd/system/hustle-life-api.service << 'EOF'
[Unit]
Description=Hustle for Life API Server
After=network.target

[Service]
Type=simple
User=dev
Group=dev
WorkingDirectory=/home/dev/repos/hustle-for-life/server
ExecStart=/usr/bin/node --import tsx/esm index.ts
Restart=always
RestartSec=5
EnvironmentFile=/home/dev/repos/hustle-for-life/server/.env
Environment=NODE_ENV=production
Environment=HOME=/home/dev
Environment=PATH=/home/dev/.local/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hustle-life-api

[Install]
WantedBy=multi-user.target
EOF
```

- [ ] **Step 2: Enable and start**

```bash
sudo systemctl daemon-reload
sudo systemctl enable hustle-life-api
sudo systemctl start hustle-life-api
systemctl status hustle-life-api
```

Expected: Service is active (running).

- [ ] **Step 3: Test via Tailscale IP**

```bash
curl http://100.99.131.90:3500/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Send ntfy notification**

```bash
curl -H "Title: Hustle for Life API" -H "Tags: rocket" \
  -d "Backend started on port 3500" ntfy.sh/hustleserver
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add systemd service for always-on backend"
```

---

## Task 10: Push to GitHub

- [ ] **Step 1: Push all work**

```bash
cd /home/dev/repos/hustle-for-life
git push origin expo-react-native
```

- [ ] **Step 2: Verify on GitHub**

Check https://github.com/CrazySwami/hustle-for-life/tree/expo-react-native

---

## Summary

After completing all 10 tasks:

1. ✅ Expo app scaffolded with all native modules
2. ✅ Tailwind CSS v4 + NativeWind v5 styled
3. ✅ Tab navigation (Home, Chat, Health, Settings)
4. ✅ AI chat with Claude Code streaming via Vercel AI SDK
5. ✅ Express backend on CT 100, always-on via systemd
6. ✅ Custom dev client built — QR code iteration from now on
7. ✅ Model support for Claude Code, Claude Sonnet 4.6, GPT 5.3, Gemini 3.1

**Next sprint:** Health dashboard + HealthKit + Dynamic Island + notifications
