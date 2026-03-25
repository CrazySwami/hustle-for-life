import { healthQuickView } from '../../widgets/HealthQuickView';
import { stepCounter } from '../../widgets/StepCounter';
import { moodTracker } from '../../widgets/MoodTracker';

export interface WidgetHealthData {
  steps: number;
  heartRate: number;
  sleep: number;
  calories: number;
  stepGoal?: number;
}

export interface WidgetMoodData {
  mood: string;
  emoji: string;
  energy: number;
  streak: number;
}

export function updateHealthWidgets(data: WidgetHealthData) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    healthQuickView.updateSnapshot({
      steps: data.steps,
      heartRate: data.heartRate,
      sleep: data.sleep,
      calories: data.calories,
      lastUpdated: timeStr,
    });
  } catch {}

  try {
    stepCounter.updateSnapshot({
      steps: data.steps,
      goal: data.stepGoal ?? 10000,
    });
  } catch {}
}

export function updateMoodWidget(data: WidgetMoodData) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    moodTracker.updateSnapshot({
      currentMood: data.mood,
      moodEmoji: data.emoji,
      energy: data.energy,
      streak: data.streak,
      lastLoggedAt: timeStr,
    });
  } catch {}
}

export function reloadAllWidgets() {
  try { healthQuickView.reload(); } catch {}
  try { stepCounter.reload(); } catch {}
  try { moodTracker.reload(); } catch {}
}
