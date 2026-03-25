import { healthActivity } from '../../widgets/HealthActivity';
import type { LiveActivity } from 'expo-widgets';

type HealthData = {
  steps: number;
  heartRate: number;
  goalProgress: number;
  status: string;
};

let currentActivity: LiveActivity<HealthData> | null = null;

const DEFAULT_HEALTH_DATA: HealthData = {
  steps: 0,
  heartRate: 0,
  goalProgress: 0,
  status: 'Starting...',
};

export function startHealthTracking(
  initialData: Partial<HealthData> = {},
): void {
  if (currentActivity) {
    return;
  }

  const data: HealthData = { ...DEFAULT_HEALTH_DATA, ...initialData };
  currentActivity = healthActivity.start(data, 'hustleforlife://health');
}

export async function updateHealthActivity(
  data: Partial<HealthData>,
): Promise<void> {
  if (!currentActivity) {
    return;
  }

  const instances = healthActivity.getInstances();
  if (instances.length === 0) {
    currentActivity = null;
    return;
  }

  const updated: HealthData = {
    steps: data.steps ?? 0,
    heartRate: data.heartRate ?? 0,
    goalProgress: data.goalProgress ?? 0,
    status: data.status ?? 'Tracking',
  };

  await currentActivity.update(updated);
}

export async function stopHealthTracking(): Promise<void> {
  if (!currentActivity) {
    return;
  }

  await currentActivity.end('default', {
    steps: 0,
    heartRate: 0,
    goalProgress: 0,
    status: 'Stopped',
  });

  currentActivity = null;
}

export function isHealthTrackingActive(): boolean {
  return currentActivity !== null;
}
