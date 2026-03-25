import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from '../../components/ui';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useHealthData } from '../../lib/health/useHealthData';
import { updateHealthWidgets } from '../../lib/widgets/updateWidgets';
import type { AllHealthData, HealthDataPoint } from '../../lib/health/healthkit';

// ---------- types ----------

interface QuickStat {
  icon: string;
  label: string;
  value: string;
  unit: string;
  trend: { direction: 'up' | 'down'; percent: number } | null;
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

interface WeeklyStepDay {
  day: string;
  steps: number;
}

// ---------- constants ----------

const LOG_ACTIONS: LogAction[] = [
  { icon: '\u{1F60A}', label: 'Log Mood', key: 'mood' },
  { icon: '\u{1F35D}', label: 'Log Meal', key: 'meal' },
  { icon: '\u{1F4A7}', label: 'Log Water', key: 'water' },
  { icon: '\u2696\uFE0F', label: 'Log Weight', key: 'weight' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function formatNumber(value: number | undefined | null, decimals = 0): string {
  if (value == null) return '--';
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
}

/**
 * Calculate trend: compare latest value to the average of prior data points.
 * Returns null if insufficient data.
 */
function calculateTrend(
  timeSeries: readonly HealthDataPoint[],
): { direction: 'up' | 'down'; percent: number } | null {
  if (timeSeries.length < 2) return null;

  const latest = timeSeries[0].value;
  const prior = timeSeries.slice(1);
  const priorAvg = prior.reduce((sum, p) => sum + p.value, 0) / prior.length;

  if (priorAvg === 0) return null;

  const percentChange = Math.abs(((latest - priorAvg) / priorAvg) * 100);
  return {
    direction: latest >= priorAvg ? 'up' : 'down',
    percent: Math.round(percentChange),
  };
}

/**
 * Derive blood pressure status from systolic/diastolic values.
 */
function bpStatus(systolic: number, diastolic: number): 'normal' | 'elevated' | 'low' {
  if (systolic < 90 || diastolic < 60) return 'low';
  if (systolic > 130 || diastolic > 85) return 'elevated';
  return 'normal';
}

function glucoseStatus(value: number): 'normal' | 'elevated' | 'low' {
  if (value < 70) return 'low';
  if (value > 100) return 'elevated';
  return 'normal';
}

function hrvStatus(value: number): 'normal' | 'elevated' | 'low' {
  if (value < 30) return 'low';
  if (value > 100) return 'elevated';
  return 'normal';
}

function weightStatus(): 'normal' {
  return 'normal';
}

// ---------- data builders ----------

function buildQuickStats(data: AllHealthData | null): QuickStat[] {
  const stepsValue = data?.steps.latest?.value;
  const hrValue = data?.heartRate.latest?.value;
  const sleepHours = data ? data.sleep.totalMinutes / 60 : undefined;
  const energyValue = data?.activeEnergyBurned.latest?.value;

  return [
    {
      icon: '\u{1F6B6}',
      label: 'Steps',
      value: formatNumber(stepsValue),
      unit: 'steps',
      trend: data ? calculateTrend(data.steps.timeSeries) : null,
      color: 'text-green',
    },
    {
      icon: '\u2764\uFE0F',
      label: 'Heart Rate',
      value: formatNumber(hrValue),
      unit: 'bpm',
      trend: data ? calculateTrend(data.heartRate.timeSeries) : null,
      color: 'text-accent',
    },
    {
      icon: '\u{1F303}',
      label: 'Sleep',
      value: sleepHours != null ? sleepHours.toFixed(1) : '--',
      unit: 'hours',
      trend: null, // Sleep segments don't map cleanly to HealthDataPoint trend
      color: 'text-blue',
    },
    {
      icon: '\u{1F525}',
      label: 'Active Energy',
      value: formatNumber(energyValue),
      unit: 'kcal',
      trend: data ? calculateTrend(data.activeEnergyBurned.timeSeries) : null,
      color: 'text-orange',
    },
  ];
}

function buildVitals(data: AllHealthData | null): VitalCard[] {
  const bp = data?.bloodPressure.latest;
  const glucose = data?.bloodGlucose.latest?.value;
  const weightVal = data?.weight.latest?.value;
  const hrvVal = data?.hrv.latest?.value;

  return [
    {
      icon: '\u{1FA78}',
      label: 'Blood Pressure',
      value: bp ? `${Math.round(bp.systolic)}/${Math.round(bp.diastolic)}` : '--/--',
      unit: 'mmHg',
      status: bp ? bpStatus(bp.systolic, bp.diastolic) : 'normal',
    },
    {
      icon: '\u{1FA79}',
      label: 'Blood Glucose',
      value: formatNumber(glucose),
      unit: 'mg/dL',
      status: glucose != null ? glucoseStatus(glucose) : 'normal',
    },
    {
      icon: '\u2696\uFE0F',
      label: 'Weight',
      value: formatNumber(weightVal, 1),
      unit: 'lbs',
      status: weightStatus(),
    },
    {
      icon: '\u{1F4C8}',
      label: 'HRV',
      value: formatNumber(hrvVal),
      unit: 'ms',
      status: hrvVal != null ? hrvStatus(hrvVal) : 'low',
    },
  ];
}

function buildWeeklySteps(data: AllHealthData | null): WeeklyStepDay[] {
  if (!data) {
    return DAY_LABELS.map((day) => ({ day, steps: 0 }));
  }

  // Group step samples by day-of-week, summing values per day
  const dailyTotals = new Map<string, number>();
  const today = new Date();

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = DAY_LABELS[d.getDay()];
    dailyTotals.set(`${i}-${label}`, 0);
  }

  // Sum step values into their respective days
  for (const point of data.steps.timeSeries) {
    const pointDate = new Date(point.startDate);
    const diffDays = Math.floor(
      (today.getTime() - pointDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays >= 0 && diffDays < 7) {
      const label = DAY_LABELS[pointDate.getDay()];
      const key = `${diffDays}-${label}`;
      dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + point.value);
    }
  }

  // Convert to ordered array (oldest first)
  const result: WeeklyStepDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = DAY_LABELS[d.getDay()];
    const key = `${i}-${label}`;
    result.push({ day: label, steps: Math.round(dailyTotals.get(key) ?? 0) });
  }

  return result;
}

// ---------- components ----------

function QuickStatCard({ stat }: { stat: QuickStat }) {
  const colorClass = stat.trend ? trendColor(stat.trend.direction, stat.label) : 'text-text-muted';

  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-2xl mb-2">{stat.icon}</Text>
      <Text className="text-text-muted text-xs font-medium tracking-wide mb-1">
        {stat.label.toUpperCase()}
      </Text>
      <Text className="text-text text-2xl font-bold">{stat.value}</Text>
      <Text className="text-text-muted text-xs mt-0.5">{stat.unit}</Text>
      <View className="flex-row items-center mt-2">
        {stat.trend ? (
          <Text className={`text-xs font-bold ${colorClass}`}>
            {trendArrow(stat.trend.direction)} {stat.trend.percent}%
          </Text>
        ) : (
          <Text className="text-xs text-text-muted">--</Text>
        )}
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

function WeeklyTrendChart({ weeklySteps }: { weeklySteps: WeeklyStepDay[] }) {
  const maxSteps = Math.max(...weeklySteps.map((d) => d.steps), 1);
  const todayLabel = DAY_LABELS[new Date().getDay()];

  return (
    <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-text font-bold text-base">Weekly Steps</Text>
        <Text className="text-text-muted text-xs">Last 7 days</Text>
      </View>

      {/* Bar chart */}
      <View className="flex-row items-end justify-between" style={{ height: 100 }}>
        {weeklySteps.map((day) => {
          const barHeight = Math.max((day.steps / maxSteps) * 80, 4);
          const isToday = day.day === todayLabel;

          return (
            <View key={day.day} className="items-center flex-1">
              <Text className={`text-xs font-bold mb-1 ${isToday ? 'text-accent' : 'text-text-muted'}`}>
                {day.steps > 0 ? `${(day.steps / 1000).toFixed(1)}k` : '0'}
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
            {Math.round(weeklySteps.reduce((s, d) => s + d.steps, 0) / 7).toLocaleString()}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-text-muted text-xs">Weekly Total</Text>
          <Text className="text-text font-bold text-base">
            {weeklySteps.reduce((s, d) => s + d.steps, 0).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View className="flex-1 bg-background items-center justify-center py-20">
      <ActivityIndicator size="large" />
      <Text className="text-text-muted mt-4 text-sm">Loading health data...</Text>
    </View>
  );
}

function HealthKitUnavailable({ message }: { message: string }) {
  return (
    <View className="flex-1 bg-background items-center justify-center px-8 py-20">
      <Text className="text-4xl mb-4">{'\u{1FA7A}'}</Text>
      <Text className="text-text font-bold text-lg text-center mb-2">
        HealthKit Unavailable
      </Text>
      <Text className="text-text-muted text-sm text-center leading-5">
        {message}
      </Text>
      <Text className="text-text-muted text-xs text-center mt-4">
        Health data requires an iPhone with HealthKit enabled.
      </Text>
    </View>
  );
}

// ---------- main screen ----------

export default function HealthScreen() {
  const { data, loading, error, refetch } = useHealthData(7);
  const [refreshing, setRefreshing] = React.useState(false);

  const quickStats = buildQuickStats(data);
  const vitals = buildVitals(data);
  const weeklySteps = buildWeeklySteps(data);

  // Push data to iOS widgets when health data loads
  useEffect(() => {
    if (!data) return;

    updateHealthWidgets({
      steps: data.steps.latest?.value ?? 0,
      heartRate: data.heartRate.latest?.value ?? 0,
      sleep: Math.round(data.sleep.totalMinutes / 60 * 10) / 10,
      calories: Math.round(data.activeEnergyBurned.latest?.value ?? 0),
    });
  }, [data]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // HealthKit not available or permissions denied
  const isUnavailable = error && !data && !loading;
  if (isUnavailable) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="px-6 pt-16 pb-2">
          <Text className="text-3xl font-bold text-text">Health</Text>
          <Text className="text-text-muted mt-1 text-sm">
            Track. Recover. Perform.
          </Text>
          <Text className="text-text-muted text-xs mt-1">{formatDate()}</Text>
        </View>
        <HealthKitUnavailable message={error} />
      </ScrollView>
    );
  }

  // Initial loading state
  if (loading && !data) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-6 pt-16 pb-2">
          <Text className="text-3xl font-bold text-text">Health</Text>
          <Text className="text-text-muted mt-1 text-sm">
            Track. Recover. Perform.
          </Text>
          <Text className="text-text-muted text-xs mt-1">{formatDate()}</Text>
        </View>
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-2">
        <Text className="text-3xl font-bold text-text">Health</Text>
        <Text className="text-text-muted mt-1 text-sm">
          Track. Recover. Perform.
        </Text>
        <Text className="text-text-muted text-xs mt-1">{formatDate()}</Text>
      </View>

      {/* Error banner (non-blocking — shows stale data with warning) */}
      {error && data && (
        <View className="mx-5 mt-3 rounded-xl bg-orange/10 border border-orange/30 px-4 py-3">
          <Text className="text-orange text-xs font-medium">
            Update failed: {error}. Showing cached data.
          </Text>
        </View>
      )}

      {/* Quick Stats Grid — Row 1 */}
      <View className="flex-row px-5 mt-5 gap-3">
        <QuickStatCard stat={quickStats[0]} />
        <QuickStatCard stat={quickStats[1]} />
      </View>

      {/* Quick Stats Grid — Row 2 */}
      <View className="flex-row px-5 mt-3 gap-3">
        <QuickStatCard stat={quickStats[2]} />
        <QuickStatCard stat={quickStats[3]} />
      </View>

      {/* Vitals Section */}
      <View className="mt-6">
        <View className="flex-row items-center justify-between px-6 mb-3">
          <Text className="text-text font-bold text-base">Vitals</Text>
          <Text className="text-text-muted text-xs">
            {data ? 'Live from HealthKit' : 'No data'}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-5"
          contentContainerClassName="pr-5"
        >
          {vitals.map((vital) => (
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
        <WeeklyTrendChart weeklySteps={weeklySteps} />
      </View>

      {/* Footer */}
      <View className="items-center py-8">
        <Text className="text-text-muted text-xs">Powered by HealthKit</Text>
      </View>
    </ScrollView>
  );
}
