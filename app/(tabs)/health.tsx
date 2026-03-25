import React from 'react';
import { View, Text, ScrollView, Pressable } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// ---------- types ----------

interface QuickStat {
  icon: string;
  label: string;
  value: string;
  unit: string;
  trend: { direction: 'up' | 'down'; percent: number };
  color: string;
}

interface VitalCard {
  icon: string;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'elevated' | 'low';
}

interface LogAction {
  icon: string;
  label: string;
  key: string;
}

// ---------- placeholder data ----------

const QUICK_STATS: QuickStat[] = [
  {
    icon: '\u{1F6B6}',
    label: 'Steps',
    value: '8,432',
    unit: 'steps',
    trend: { direction: 'up', percent: 12 },
    color: 'text-green',
  },
  {
    icon: '\u2764\uFE0F',
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    trend: { direction: 'down', percent: 3 },
    color: 'text-accent',
  },
  {
    icon: '\u{1F303}',
    label: 'Sleep',
    value: '7.2',
    unit: 'hours',
    trend: { direction: 'up', percent: 8 },
    color: 'text-blue',
  },
  {
    icon: '\u{1F525}',
    label: 'Active Energy',
    value: '486',
    unit: 'kcal',
    trend: { direction: 'up', percent: 5 },
    color: 'text-orange',
  },
];

const VITALS: VitalCard[] = [
  { icon: '\u{1FA78}', label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'normal' },
  { icon: '\u{1FA79}', label: 'Blood Glucose', value: '94', unit: 'mg/dL', status: 'normal' },
  { icon: '\u2696\uFE0F', label: 'Weight', value: '172.4', unit: 'lbs', status: 'normal' },
  { icon: '\u{1F4C8}', label: 'HRV', value: '48', unit: 'ms', status: 'low' },
];

const LOG_ACTIONS: LogAction[] = [
  { icon: '\u{1F60A}', label: 'Log Mood', key: 'mood' },
  { icon: '\u{1F35D}', label: 'Log Meal', key: 'meal' },
  { icon: '\u{1F4A7}', label: 'Log Water', key: 'water' },
  { icon: '\u2696\uFE0F', label: 'Log Weight', key: 'weight' },
];

const WEEKLY_STEPS = [
  { day: 'Mon', steps: 6200 },
  { day: 'Tue', steps: 9100 },
  { day: 'Wed', steps: 7800 },
  { day: 'Thu', steps: 10400 },
  { day: 'Fri', steps: 5600 },
  { day: 'Sat', steps: 11200 },
  { day: 'Sun', steps: 8432 },
];

// ---------- helpers ----------

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function trendArrow(direction: 'up' | 'down'): string {
  return direction === 'up' ? '\u2191' : '\u2193';
}

function trendColor(direction: 'up' | 'down', label: string): string {
  // For heart rate, down is good; for everything else, up is good
  const isGood =
    label === 'Heart Rate' ? direction === 'down' : direction === 'up';
  return isGood ? 'text-green' : 'text-accent';
}

function statusColor(status: 'normal' | 'elevated' | 'low'): string {
  switch (status) {
    case 'normal':
      return 'text-green';
    case 'elevated':
      return 'text-orange';
    case 'low':
      return 'text-accent';
  }
}

function statusLabel(status: 'normal' | 'elevated' | 'low'): string {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'elevated':
      return 'Elevated';
    case 'low':
      return 'Low';
  }
}

// ---------- components ----------

function QuickStatCard({ stat }: { stat: QuickStat }) {
  const colorClass = trendColor(stat.trend.direction, stat.label);

  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-2xl mb-2">{stat.icon}</Text>
      <Text className="text-text-muted text-xs font-medium tracking-wide mb-1">
        {stat.label.toUpperCase()}
      </Text>
      <Text className="text-text text-2xl font-bold">{stat.value}</Text>
      <Text className="text-text-muted text-xs mt-0.5">{stat.unit}</Text>
      <View className="flex-row items-center mt-2">
        <Text className={`text-xs font-bold ${colorClass}`}>
          {trendArrow(stat.trend.direction)} {stat.trend.percent}%
        </Text>
      </View>
    </View>
  );
}

function VitalCardComponent({ vital }: { vital: VitalCard }) {
  return (
    <View className="w-36 rounded-2xl border border-border bg-surface p-4 mr-3">
      <Text className="text-xl mb-2">{vital.icon}</Text>
      <Text className="text-text-muted text-xs font-medium tracking-wide mb-1">
        {vital.label.toUpperCase()}
      </Text>
      <Text className="text-text text-lg font-bold">{vital.value}</Text>
      <Text className="text-text-muted text-xs">{vital.unit}</Text>
      <View className="flex-row items-center mt-2">
        <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusColor(vital.status) === 'text-green' ? 'bg-green' : statusColor(vital.status) === 'text-orange' ? 'bg-orange' : 'bg-accent'}`} />
        <Text className={`text-xs font-medium ${statusColor(vital.status)}`}>
          {statusLabel(vital.status)}
        </Text>
      </View>
    </View>
  );
}

function LogButton({ action }: { action: LogAction }) {
  const router = useRouter();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push(`/log/${action.key}` as `/log/mood` | `/log/meal` | `/log/water` | `/log/weight`);
  };

  return (
    <Pressable
      className="flex-1 rounded-2xl border border-border bg-surface p-4 items-center"
      onPress={handlePress}
    >
      <Text className="text-2xl mb-1.5">{action.icon}</Text>
      <Text className="text-text text-xs font-medium">{action.label}</Text>
    </Pressable>
  );
}

function WeeklyTrendChart() {
  const maxSteps = Math.max(...WEEKLY_STEPS.map((d) => d.steps));

  return (
    <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-text font-bold text-base">Weekly Steps</Text>
        <Text className="text-text-muted text-xs">Last 7 days</Text>
      </View>

      {/* Bar chart */}
      <View className="flex-row items-end justify-between" style={{ height: 100 }}>
        {WEEKLY_STEPS.map((day) => {
          const barHeight = Math.max((day.steps / maxSteps) * 80, 4);
          const isToday = day.day === 'Sun';

          return (
            <View key={day.day} className="items-center flex-1">
              <Text className={`text-xs font-bold mb-1 ${isToday ? 'text-accent' : 'text-text-muted'}`}>
                {(day.steps / 1000).toFixed(1)}k
              </Text>
              <View
                className={`w-5 rounded-full ${isToday ? 'bg-accent' : 'bg-border'}`}
                style={{ height: barHeight }}
              />
              <Text className={`text-xs mt-2 ${isToday ? 'text-accent font-bold' : 'text-text-muted'}`}>
                {day.day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-border">
        <View>
          <Text className="text-text-muted text-xs">Daily Average</Text>
          <Text className="text-text font-bold text-base">
            {Math.round(WEEKLY_STEPS.reduce((s, d) => s + d.steps, 0) / 7).toLocaleString()}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-text-muted text-xs">Weekly Total</Text>
          <Text className="text-text font-bold text-base">
            {WEEKLY_STEPS.reduce((s, d) => s + d.steps, 0).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------- main screen ----------

export default function HealthScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-2">
        <Text className="text-3xl font-bold text-text">Health</Text>
        <Text className="text-text-muted mt-1 text-sm">
          Track. Recover. Perform.
        </Text>
        <Text className="text-text-muted text-xs mt-1">{formatDate()}</Text>
      </View>

      {/* Quick Stats Grid — Row 1 */}
      <View className="flex-row px-5 mt-5 gap-3">
        <QuickStatCard stat={QUICK_STATS[0]} />
        <QuickStatCard stat={QUICK_STATS[1]} />
      </View>

      {/* Quick Stats Grid — Row 2 */}
      <View className="flex-row px-5 mt-3 gap-3">
        <QuickStatCard stat={QUICK_STATS[2]} />
        <QuickStatCard stat={QUICK_STATS[3]} />
      </View>

      {/* Vitals Section */}
      <View className="mt-6">
        <View className="flex-row items-center justify-between px-6 mb-3">
          <Text className="text-text font-bold text-base">Vitals</Text>
          <Text className="text-text-muted text-xs">Updated 2h ago</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-5"
          contentContainerClassName="pr-5"
        >
          {VITALS.map((vital) => (
            <VitalCardComponent key={vital.label} vital={vital} />
          ))}
        </ScrollView>
      </View>

      {/* Manual Log Section */}
      <View className="mt-6">
        <Text className="text-text font-bold text-base px-6 mb-3">
          Quick Log
        </Text>
        <View className="flex-row px-5 gap-3">
          {LOG_ACTIONS.map((action) => (
            <LogButton key={action.key} action={action} />
          ))}
        </View>
      </View>

      {/* Weekly Trend */}
      <View className="mt-6">
        <WeeklyTrendChart />
      </View>

      {/* Footer */}
      <View className="items-center py-8">
        <Text className="text-text-muted text-xs">Powered by HealthKit</Text>
      </View>
    </ScrollView>
  );
}
