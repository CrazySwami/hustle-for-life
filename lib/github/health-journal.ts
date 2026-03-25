import { createOrUpdateFile, getFile } from './client';

export interface DailyHealthData {
  readonly steps?: number;
  readonly heartRate?: number;
  readonly restingHeartRate?: number;
  readonly hrv?: number;
  readonly bloodPressureSystolic?: number;
  readonly bloodPressureDiastolic?: number;
  readonly bloodGlucose?: number;
  readonly weight?: number;
  readonly bodyFatPercentage?: number;
  readonly activeEnergyBurned?: number;
  readonly sleepHours?: number;
  readonly mood?: string;
  readonly energy?: number;
  readonly meals?: readonly MealEntry[];
  readonly notes?: string;
}

export interface MealEntry {
  readonly type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  readonly description: string;
  readonly calories?: number;
}

export interface ParsedDailyLog {
  readonly date: string;
  readonly data: DailyHealthData;
  readonly raw: string;
}

const dailyLogPath = (date: string): string =>
  `health/daily/${date}.md`;

const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

const formatDisplayDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const formatNumber = (n: number): string =>
  n.toLocaleString('en-US');

const buildFrontmatter = (date: string, data: DailyHealthData): string => {
  const fields: string[] = [`date: ${date}`];
  if (data.steps != null) fields.push(`steps: ${data.steps}`);
  if (data.heartRate != null) fields.push(`heart_rate: ${data.heartRate}`);
  if (data.restingHeartRate != null) fields.push(`resting_heart_rate: ${data.restingHeartRate}`);
  if (data.hrv != null) fields.push(`hrv: ${data.hrv}`);
  if (data.bloodPressureSystolic != null && data.bloodPressureDiastolic != null) {
    fields.push(`blood_pressure: ${data.bloodPressureSystolic}/${data.bloodPressureDiastolic}`);
  }
  if (data.bloodGlucose != null) fields.push(`blood_glucose: ${data.bloodGlucose}`);
  if (data.weight != null) fields.push(`weight: ${data.weight}`);
  if (data.bodyFatPercentage != null) fields.push(`body_fat: ${data.bodyFatPercentage}`);
  if (data.activeEnergyBurned != null) fields.push(`active_energy: ${data.activeEnergyBurned}`);
  if (data.sleepHours != null) fields.push(`sleep_hours: ${data.sleepHours}`);
  if (data.mood) fields.push(`mood: ${data.mood}`);
  if (data.energy != null) fields.push(`energy: ${data.energy}`);
  return `---\n${fields.join('\n')}\n---`;
};

const buildVitalsSection = (data: DailyHealthData): string => {
  const lines: string[] = ['## Vitals'];
  if (data.steps != null) lines.push(`- Steps: ${formatNumber(data.steps)}`);
  if (data.heartRate != null) lines.push(`- Heart Rate: ${data.heartRate} bpm`);
  if (data.restingHeartRate != null) lines.push(`- Resting Heart Rate: ${data.restingHeartRate} bpm`);
  if (data.hrv != null) lines.push(`- HRV: ${data.hrv} ms`);
  if (data.bloodPressureSystolic != null && data.bloodPressureDiastolic != null) {
    lines.push(`- Blood Pressure: ${data.bloodPressureSystolic}/${data.bloodPressureDiastolic} mmHg`);
  }
  if (data.bloodGlucose != null) lines.push(`- Blood Glucose: ${data.bloodGlucose} mg/dL`);
  if (data.weight != null) lines.push(`- Weight: ${data.weight} lbs`);
  if (data.bodyFatPercentage != null) lines.push(`- Body Fat: ${data.bodyFatPercentage}%`);
  if (data.activeEnergyBurned != null) lines.push(`- Active Energy: ${formatNumber(data.activeEnergyBurned)} kcal`);
  if (data.sleepHours != null) lines.push(`- Sleep: ${data.sleepHours} hours`);
  return lines.length > 1 ? lines.join('\n') : '';
};

const buildMealsSection = (meals: readonly MealEntry[]): string => {
  if (meals.length === 0) return '';
  const lines = ['## Meals', ...meals.map(m =>
    m.calories != null
      ? `- ${m.type}: ${m.description} (${m.calories} cal)`
      : `- ${m.type}: ${m.description}`,
  )];
  return lines.join('\n');
};

const buildMoodSection = (data: DailyHealthData): string => {
  const lines: string[] = ['## Mood & Energy'];
  if (data.mood) {
    const energyPart = data.energy != null ? ` (energy ${data.energy}/10)` : '';
    lines.push(`- Mood: ${data.mood}${energyPart}`);
  }
  return lines.length > 1 ? lines.join('\n') : '';
};

const buildMarkdown = (date: string, data: DailyHealthData): string => {
  const dateObj = new Date(date + 'T00:00:00');
  const sections = [
    buildFrontmatter(date, data),
    '',
    `# Health Log — ${formatDisplayDate(dateObj)}`,
    '',
    buildVitalsSection(data),
    buildMealsSection(data.meals ?? []),
    buildMoodSection(data),
    data.notes ? `## Notes\n${data.notes}` : '',
  ].filter(Boolean);

  return sections.join('\n\n').trim() + '\n';
};

const parseFrontmatter = (content: string): Record<string, string> => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1].split('\n')
      .map(line => line.split(': '))
      .filter(parts => parts.length >= 2)
      .map(([key, ...rest]) => [key.trim(), rest.join(': ').trim()]),
  );
};

const parseDailyLog = (date: string, content: string): ParsedDailyLog => {
  const fm = parseFrontmatter(content);
  const bp = fm.blood_pressure?.split('/');
  return {
    date,
    raw: content,
    data: {
      steps: fm.steps ? Number(fm.steps) : undefined,
      heartRate: fm.heart_rate ? Number(fm.heart_rate) : undefined,
      restingHeartRate: fm.resting_heart_rate ? Number(fm.resting_heart_rate) : undefined,
      hrv: fm.hrv ? Number(fm.hrv) : undefined,
      bloodPressureSystolic: bp ? Number(bp[0]) : undefined,
      bloodPressureDiastolic: bp ? Number(bp[1]) : undefined,
      bloodGlucose: fm.blood_glucose ? Number(fm.blood_glucose) : undefined,
      weight: fm.weight ? Number(fm.weight) : undefined,
      bodyFatPercentage: fm.body_fat ? Number(fm.body_fat) : undefined,
      activeEnergyBurned: fm.active_energy ? Number(fm.active_energy) : undefined,
      sleepHours: fm.sleep_hours ? Number(fm.sleep_hours) : undefined,
      mood: fm.mood,
      energy: fm.energy ? Number(fm.energy) : undefined,
    },
  };
};

export const commitHealthLog = async (
  date: Date,
  data: DailyHealthData,
): Promise<void> => {
  const dateStr = formatDate(date);
  const path = dailyLogPath(dateStr);

  const existing = await getFile(path);
  let mergedData = data;

  if (existing) {
    const parsed = parseDailyLog(dateStr, existing.content);
    mergedData = { ...parsed.data, ...data };
  }

  const markdown = buildMarkdown(dateStr, mergedData);
  await createOrUpdateFile(path, markdown, `health: update daily log ${dateStr}`);
};

export const commitMoodLog = async (
  date: Date,
  mood: string,
  energy: number,
  notes?: string,
): Promise<void> => {
  await commitHealthLog(date, { mood, energy, notes });
};

export const commitMealLog = async (
  date: Date,
  meal: MealEntry,
): Promise<void> => {
  const dateStr = formatDate(date);
  const path = dailyLogPath(dateStr);

  const existing = await getFile(path);
  const existingMeals: MealEntry[] = [];

  if (existing) {
    const mealMatches = existing.content.matchAll(/^- (Breakfast|Lunch|Dinner|Snack): (.+?)(?:\s*\((\d+) cal\))?$/gm);
    for (const m of mealMatches) {
      existingMeals.push({
        type: m[1] as MealEntry['type'],
        description: m[2],
        calories: m[3] ? Number(m[3]) : undefined,
      });
    }
  }

  const meals = [...existingMeals, meal];
  await commitHealthLog(date, { meals });
};

export const getHealthHistory = async (
  days: number = 7,
): Promise<readonly ParsedDailyLog[]> => {
  const logs: ParsedDailyLog[] = [];
  const today = new Date();

  const fetches = Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    return getFile(dailyLogPath(dateStr)).then(file =>
      file ? parseDailyLog(dateStr, file.content) : null,
    );
  });

  const results = await Promise.allSettled(fetches);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      logs.push(result.value);
    }
  }

  return logs.sort((a, b) => b.date.localeCompare(a.date));
};
