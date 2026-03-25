import { createOrUpdateFile, getFile } from './client';
import { getHealthHistory, type ParsedDailyLog, type DailyHealthData } from './health-journal';

interface WeeklyStats {
  readonly daysLogged: number;
  readonly avgSteps: number | null;
  readonly avgHeartRate: number | null;
  readonly avgRestingHeartRate: number | null;
  readonly avgHRV: number | null;
  readonly avgSleepHours: number | null;
  readonly avgWeight: number | null;
  readonly avgBloodGlucose: number | null;
  readonly avgActiveEnergy: number | null;
  readonly totalSteps: number | null;
  readonly moods: readonly string[];
  readonly avgEnergy: number | null;
  readonly weightTrend: 'up' | 'down' | 'stable' | null;
  readonly stepsTrend: 'up' | 'down' | 'stable' | null;
}

const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

const formatDisplayDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const formatNumber = (n: number): string =>
  n.toLocaleString('en-US');

const getISOWeek = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const weeklyPath = (weekLabel: string): string =>
  `health/weekly/${weekLabel}.md`;

const average = (values: readonly number[]): number | null =>
  values.length === 0 ? null : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

const sum = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0);

const extractValues = (
  logs: readonly ParsedDailyLog[],
  key: keyof DailyHealthData,
): number[] =>
  logs
    .map(l => l.data[key])
    .filter((v): v is number => typeof v === 'number');

const determineTrend = (values: readonly number[]): 'up' | 'down' | 'stable' | null => {
  if (values.length < 2) return null;
  const first = values[values.length - 1];
  const last = values[0];
  const diff = last - first;
  const threshold = Math.abs(first) * 0.02;
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
};

const trendEmoji = (trend: 'up' | 'down' | 'stable' | null): string => {
  if (trend === 'up') return '(trending up)';
  if (trend === 'down') return '(trending down)';
  if (trend === 'stable') return '(stable)';
  return '';
};

const computeStats = (logs: readonly ParsedDailyLog[]): WeeklyStats => {
  const steps = extractValues(logs, 'steps');
  const weights = extractValues(logs, 'weight');
  const moods = logs.map(l => l.data.mood).filter((m): m is string => !!m);

  return {
    daysLogged: logs.length,
    avgSteps: average(steps),
    totalSteps: sum(steps),
    avgHeartRate: average(extractValues(logs, 'heartRate')),
    avgRestingHeartRate: average(extractValues(logs, 'restingHeartRate')),
    avgHRV: average(extractValues(logs, 'hrv')),
    avgSleepHours: average(extractValues(logs, 'sleepHours')),
    avgWeight: average(weights),
    avgBloodGlucose: average(extractValues(logs, 'bloodGlucose')),
    avgActiveEnergy: average(extractValues(logs, 'activeEnergyBurned')),
    avgEnergy: average(extractValues(logs, 'energy')),
    moods,
    weightTrend: determineTrend(weights),
    stepsTrend: determineTrend(steps),
  };
};

const buildWeeklyMarkdown = (
  weekLabel: string,
  weekStart: Date,
  weekEnd: Date,
  stats: WeeklyStats,
): string => {
  const frontmatterFields = [
    `week: ${weekLabel}`,
    `start: ${formatDate(weekStart)}`,
    `end: ${formatDate(weekEnd)}`,
    `days_logged: ${stats.daysLogged}`,
  ];
  if (stats.avgSteps != null) frontmatterFields.push(`avg_steps: ${stats.avgSteps}`);
  if (stats.avgHeartRate != null) frontmatterFields.push(`avg_heart_rate: ${stats.avgHeartRate}`);
  if (stats.avgSleepHours != null) frontmatterFields.push(`avg_sleep_hours: ${stats.avgSleepHours}`);
  if (stats.avgWeight != null) frontmatterFields.push(`avg_weight: ${stats.avgWeight}`);

  const sections: string[] = [
    `---\n${frontmatterFields.join('\n')}\n---`,
    '',
    `# Weekly Summary — ${formatDisplayDate(weekStart)} to ${formatDisplayDate(weekEnd)}`,
    '',
    `**${stats.daysLogged} of 7 days logged**`,
    '',
  ];

  const activityLines: string[] = ['## Activity'];
  if (stats.totalSteps != null) activityLines.push(`- Total Steps: ${formatNumber(stats.totalSteps)}`);
  if (stats.avgSteps != null) activityLines.push(`- Avg Steps/Day: ${formatNumber(stats.avgSteps)} ${trendEmoji(stats.stepsTrend)}`);
  if (stats.avgActiveEnergy != null) activityLines.push(`- Avg Active Energy: ${formatNumber(stats.avgActiveEnergy)} kcal`);
  if (activityLines.length > 1) sections.push(activityLines.join('\n'));

  const vitalsLines: string[] = ['## Vitals'];
  if (stats.avgHeartRate != null) vitalsLines.push(`- Avg Heart Rate: ${stats.avgHeartRate} bpm`);
  if (stats.avgRestingHeartRate != null) vitalsLines.push(`- Avg Resting HR: ${stats.avgRestingHeartRate} bpm`);
  if (stats.avgHRV != null) vitalsLines.push(`- Avg HRV: ${stats.avgHRV} ms`);
  if (stats.avgBloodGlucose != null) vitalsLines.push(`- Avg Blood Glucose: ${stats.avgBloodGlucose} mg/dL`);
  if (vitalsLines.length > 1) sections.push(vitalsLines.join('\n'));

  const bodyLines: string[] = ['## Body'];
  if (stats.avgWeight != null) bodyLines.push(`- Avg Weight: ${stats.avgWeight} lbs ${trendEmoji(stats.weightTrend)}`);
  if (bodyLines.length > 1) sections.push(bodyLines.join('\n'));

  const sleepLines: string[] = ['## Sleep'];
  if (stats.avgSleepHours != null) sleepLines.push(`- Avg Sleep: ${stats.avgSleepHours} hours`);
  if (sleepLines.length > 1) sections.push(sleepLines.join('\n'));

  if (stats.moods.length > 0 || stats.avgEnergy != null) {
    const moodLines: string[] = ['## Mood & Energy'];
    if (stats.moods.length > 0) moodLines.push(`- Moods: ${stats.moods.join(', ')}`);
    if (stats.avgEnergy != null) moodLines.push(`- Avg Energy: ${stats.avgEnergy}/10`);
    sections.push(moodLines.join('\n'));
  }

  return sections.join('\n\n').trim() + '\n';
};

const getWeekDates = (weekStart: Date): { start: Date; end: Date } => {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
};

const getLogsForWeek = async (
  weekStart: Date,
): Promise<readonly ParsedDailyLog[]> => {
  const { start, end } = getWeekDates(weekStart);
  const allLogs = await getHealthHistory(14);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return allLogs.filter(log => log.date >= startStr && log.date <= endStr);
};

export const generateWeeklySummary = async (
  weekStart: Date,
): Promise<{ readonly path: string; readonly stats: WeeklyStats }> => {
  const { start, end } = getWeekDates(weekStart);
  const weekLabel = getISOWeek(start);
  const logs = await getLogsForWeek(weekStart);
  const stats = computeStats(logs);
  const markdown = buildWeeklyMarkdown(weekLabel, start, end, stats);
  const path = weeklyPath(weekLabel);

  await createOrUpdateFile(path, markdown, `health: weekly summary ${weekLabel}`);

  return { path, stats };
};

export const getWeeklySummary = async (
  weekStart: Date,
): Promise<string | null> => {
  const { start } = getWeekDates(weekStart);
  const weekLabel = getISOWeek(start);
  const file = await getFile(weeklyPath(weekLabel));
  return file?.content ?? null;
};
