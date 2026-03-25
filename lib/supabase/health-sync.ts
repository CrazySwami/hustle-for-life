import { getSupabaseClient } from './client';
import { enqueue } from './offline-queue';
import type {
  HealthDataPoint,
  BloodPressureReading,
  SleepSegment,
  AllHealthData,
} from '../health/healthkit';

export type HealthLogType =
  | 'steps'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'
  | 'blood_pressure'
  | 'blood_glucose'
  | 'weight'
  | 'body_fat'
  | 'active_energy'
  | 'sleep'
  | 'mood'
  | 'meal'
  | 'water';

export interface HealthLogRow {
  readonly id?: string;
  readonly user_id: string;
  readonly type: HealthLogType;
  readonly value: number;
  readonly unit: string;
  readonly metadata?: Record<string, unknown>;
  readonly recorded_at: string;
  readonly synced_at?: string;
}

export interface HealthLogInsert {
  readonly type: HealthLogType;
  readonly value: number;
  readonly unit: string;
  readonly metadata?: Record<string, unknown>;
  readonly recorded_at: string;
}

const TABLE = 'health_logs';

const getCurrentUserId = async (): Promise<string> => {
  const supabase = await getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
};

const upsertRows = async (rows: HealthLogInsert[]): Promise<void> => {
  if (rows.length === 0) return;

  const userId = await getCurrentUserId();
  const withUser = rows.map((row) => ({
    ...row,
    user_id: userId,
    synced_at: new Date().toISOString(),
  }));

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from(TABLE).insert(withUser);
    if (error) throw error;
  } catch {
    await enqueue(TABLE, 'insert', withUser);
  }
};

const toIso = (date: Date | string): string =>
  date instanceof Date ? date.toISOString() : new Date(date).toISOString();

const healthPointToRow = (
  type: HealthLogType,
  point: HealthDataPoint
): HealthLogInsert => ({
  type,
  value: point.value,
  unit: point.unit,
  recorded_at: toIso(point.startDate),
  metadata: { endDate: toIso(point.endDate) },
});

const healthPointsToRows = (
  type: HealthLogType,
  points: readonly HealthDataPoint[]
): HealthLogInsert[] => points.map((p) => healthPointToRow(type, p));

export const syncSteps = async (points: readonly HealthDataPoint[]): Promise<void> =>
  upsertRows(healthPointsToRows('steps', points));

export const syncHeartRate = async (points: readonly HealthDataPoint[]): Promise<void> =>
  upsertRows(healthPointsToRows('heart_rate', points));

export const syncSleep = async (segments: readonly SleepSegment[]): Promise<void> => {
  const rows: HealthLogInsert[] = segments.map((seg) => ({
    type: 'sleep' as const,
    value: seg.durationMinutes,
    unit: 'min',
    recorded_at: toIso(seg.startDate),
    metadata: {
      sleepValue: seg.value,
      endDate: toIso(seg.endDate),
    },
  }));
  return upsertRows(rows);
};

export const syncBloodPressure = async (
  readings: readonly BloodPressureReading[]
): Promise<void> => {
  const rows: HealthLogInsert[] = readings.map((r) => ({
    type: 'blood_pressure' as const,
    value: r.systolic,
    unit: r.unit,
    recorded_at: toIso(r.date),
    metadata: { diastolic: r.diastolic },
  }));
  return upsertRows(rows);
};

export const syncBloodGlucose = async (points: readonly HealthDataPoint[]): Promise<void> =>
  upsertRows(healthPointsToRows('blood_glucose', points));

export const syncWeight = async (points: readonly HealthDataPoint[]): Promise<void> =>
  upsertRows(healthPointsToRows('weight', points));

export const syncMood = async (
  value: number,
  note?: string
): Promise<void> =>
  upsertRows([{
    type: 'mood',
    value,
    unit: 'score',
    recorded_at: new Date().toISOString(),
    metadata: note ? { note } : undefined,
  }]);

export const syncMeal = async (
  calories: number,
  description?: string,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<void> =>
  upsertRows([{
    type: 'meal',
    value: calories,
    unit: 'kcal',
    recorded_at: new Date().toISOString(),
    metadata: { description, mealType },
  }]);

export const syncWater = async (amountMl: number): Promise<void> =>
  upsertRows([{
    type: 'water',
    value: amountMl,
    unit: 'mL',
    recorded_at: new Date().toISOString(),
  }]);

export const syncAllHealthData = async (data: AllHealthData): Promise<void> => {
  const operations = [
    syncSteps(data.steps.timeSeries),
    syncHeartRate(data.heartRate.timeSeries),
    syncSleep(data.sleep.timeSeries),
    syncBloodPressure(data.bloodPressure.timeSeries),
    syncBloodGlucose(data.bloodGlucose.timeSeries),
    syncWeight(data.weight.timeSeries),
  ];

  const results = await Promise.allSettled(operations);
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Health sync: ${failures.length}/${results.length} operations queued offline`);
  }
};

export const getHealthHistory = async (
  type: HealthLogType,
  days: number = 7
): Promise<HealthLogRow[]> => {
  const supabase = await getSupabaseClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('type', type)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as HealthLogRow[];
};

export const getLatestHealthLog = async (
  type: HealthLogType
): Promise<HealthLogRow | null> => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('type', type)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as HealthLogRow | null;
};

export const getDailySummary = async (
  type: HealthLogType,
  date: Date = new Date()
): Promise<{ total: number; count: number; unit: string }> => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('value, unit')
    .eq('type', type)
    .gte('recorded_at', dayStart.toISOString())
    .lte('recorded_at', dayEnd.toISOString());

  if (error) throw error;

  const rows = (data ?? []) as { value: number; unit: string }[];
  const total = rows.reduce((sum, r) => sum + Number(r.value), 0);
  return { total, count: rows.length, unit: rows[0]?.unit ?? '' };
};
