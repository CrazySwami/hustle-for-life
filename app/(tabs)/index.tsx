import React from 'react';
import { View, Text, ScrollView } from '../../components/ui';

// ---------- types ----------
type ItemStatus = 'done' | 'active' | 'upcoming';

interface RoadmapItem {
  label: string;
  status: ItemStatus;
}

interface Sprint {
  number: number;
  title: string;
  status: ItemStatus;
  items: RoadmapItem[];
}

// ---------- data ----------
const SPRINTS: Sprint[] = [
  {
    number: 1,
    title: 'Foundation + AI Chat',
    status: 'done',
    items: [
      { label: 'AI Chat with Claude Code (streaming)', status: 'done' },
      { label: 'Multi-model AI (Claude Sonnet 4.6, GPT 5.3, Gemini 3.1)', status: 'done' },
      { label: 'Vercel AI SDK integration', status: 'done' },
      { label: 'Dark theme UI with Tailwind', status: 'done' },
      { label: 'Always-on backend (CT 100)', status: 'done' },
      { label: 'Web dashboard (life.hustletogether.com)', status: 'done' },
      { label: 'GitHub data repos (life-os + hustle-for-life)', status: 'done' },
    ],
  },
  {
    number: 2,
    title: 'Health + Native',
    status: 'active',
    items: [
      { label: 'HealthKit integration (steps, HR, sleep, BP, glucose, weight)', status: 'active' },
      { label: 'Health dashboard with trend cards', status: 'active' },
      { label: 'Manual logging (mood, meals, water)', status: 'active' },
      { label: 'Sync to Supabase', status: 'active' },
      { label: 'Sync to GitHub (life-os repo)', status: 'active' },
      { label: 'Push notifications (reminders)', status: 'active' },
      { label: 'Face ID / biometrics', status: 'active' },
      { label: 'Haptic feedback', status: 'active' },
    ],
  },
  {
    number: 3,
    title: 'Dynamic Island + Action Button',
    status: 'upcoming',
    items: [
      { label: 'Dynamic Island (live step count, AI status)', status: 'upcoming' },
      { label: 'Live Activities on Lock Screen', status: 'upcoming' },
      { label: 'Action Button (quick Claude chat)', status: 'upcoming' },
      { label: 'Background health sync', status: 'upcoming' },
    ],
  },
  {
    number: 4,
    title: 'Life OS Hub',
    status: 'upcoming',
    items: [
      { label: 'All domains view (health, finance, routines, projects)', status: 'upcoming' },
      { label: 'Quick actions', status: 'upcoming' },
      { label: 'GitHub read/write from app', status: 'upcoming' },
      { label: 'Offline mode (SQLite cache)', status: 'upcoming' },
      { label: 'Web build for Mac', status: 'upcoming' },
    ],
  },
  {
    number: 5,
    title: 'Polish + Ship',
    status: 'upcoming',
    items: [
      { label: 'Conversation history', status: 'upcoming' },
      { label: 'Voice input', status: 'upcoming' },
      { label: 'Camera capture', status: 'upcoming' },
      { label: 'SwiftUI-style animations', status: 'upcoming' },
      { label: 'App Store submission', status: 'upcoming' },
    ],
  },
];

// ---------- helpers ----------
function statusIcon(status: ItemStatus): string {
  switch (status) {
    case 'done':
      return '\u2705';
    case 'active':
      return '\uD83D\uDFE0';
    case 'upcoming':
      return '\u26AA';
  }
}

function sprintBadgeClasses(status: ItemStatus): string {
  switch (status) {
    case 'done':
      return 'bg-green/20 border border-green/40';
    case 'active':
      return 'bg-orange/20 border border-orange/40';
    case 'upcoming':
      return 'bg-border/30 border border-border';
  }
}

function sprintBadgeTextClasses(status: ItemStatus): string {
  switch (status) {
    case 'done':
      return 'text-green';
    case 'active':
      return 'text-orange';
    case 'upcoming':
      return 'text-text-muted';
  }
}

function sprintStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'done':
      return 'COMPLETE';
    case 'active':
      return 'IN PROGRESS';
    case 'upcoming':
      return 'UPCOMING';
  }
}

// ---------- components ----------

function SprintCard({ sprint }: { sprint: Sprint }) {
  const dimmed = sprint.status === 'upcoming';

  return (
    <View className={`mx-4 mb-4 rounded-2xl border ${dimmed ? 'border-border/50 bg-surface/60' : 'border-border bg-surface'} overflow-hidden`}>
      {/* Sprint header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View className="flex-1">
          <Text className={`text-xs font-bold tracking-widest ${dimmed ? 'text-text-muted/50' : 'text-text-muted'}`}>
            SPRINT {sprint.number}
          </Text>
          <Text className={`text-lg font-bold mt-0.5 ${dimmed ? 'text-text/40' : 'text-text'}`}>
            {sprint.title}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${sprintBadgeClasses(sprint.status)}`}>
          <Text className={`text-xs font-bold ${sprintBadgeTextClasses(sprint.status)}`}>
            {sprintStatusLabel(sprint.status)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className={`h-px ${dimmed ? 'bg-border/30' : 'bg-border/60'} mx-4`} />

      {/* Items */}
      <View className="px-4 py-3">
        {sprint.items.map((item, idx) => (
          <View key={idx} className="flex-row items-start py-1.5">
            <Text className="text-sm mr-2.5 mt-px">{statusIcon(item.status)}</Text>
            <Text className={`text-sm flex-1 leading-5 ${dimmed ? 'text-text/35' : item.status === 'done' ? 'text-text/80' : 'text-text/70'}`}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- main screen ----------

export default function HomeScreen() {
  const totalItems = SPRINTS.reduce((sum, s) => sum + s.items.length, 0);
  const doneItems = SPRINTS.reduce(
    (sum, s) => sum + s.items.filter((i) => i.status === 'done').length,
    0
  );
  const progressPct = Math.round((doneItems / totalItems) * 100);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-2">
        <Text className="text-3xl font-bold text-text">Hustle for Life</Text>
        <Text className="text-text-muted mt-1 text-base italic">
          You can't hustle if you're broken.
        </Text>
      </View>

      {/* Progress bar */}
      <View className="mx-6 mt-4 mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold text-text-muted tracking-widest">ROADMAP PROGRESS</Text>
          <Text className="text-xs font-bold text-accent">
            {doneItems}/{totalItems} ({progressPct}%)
          </Text>
        </View>
        <View className="h-2 rounded-full bg-border/50 overflow-hidden">
          <View
            className="h-2 rounded-full bg-green"
            style={{ width: `${progressPct}%` }}
          />
        </View>
      </View>

      {/* Sprint cards */}
      {SPRINTS.map((sprint) => (
        <SprintCard key={sprint.number} sprint={sprint} />
      ))}

      {/* Footer */}
      <View className="items-center py-8">
        <Text className="text-text-muted/40 text-xs">
          Built with Expo + Claude Code + Vercel AI SDK
        </Text>
      </View>
    </ScrollView>
  );
}
