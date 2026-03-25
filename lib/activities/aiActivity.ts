import { aiStatusActivity } from '../../widgets/AIStatusActivity';
import type { LiveActivity } from 'expo-widgets';

type AIStatusData = {
  status: 'idle' | 'thinking' | 'responding';
  lastMessage: string;
  model: string;
};

let currentActivity: LiveActivity<AIStatusData> | null = null;

const DEFAULT_AI_DATA: AIStatusData = {
  status: 'idle',
  lastMessage: '',
  model: 'claude-sonnet-4-6',
};

export function startAIActivity(
  model: string = 'claude-sonnet-4-6',
): void {
  if (currentActivity) {
    return;
  }

  currentActivity = aiStatusActivity.start(
    { ...DEFAULT_AI_DATA, model },
    'hustleforlife://chat',
  );
}

export async function updateAIStatus(
  status: AIStatusData['status'],
  message: string,
  model: string,
): Promise<void> {
  if (!currentActivity) {
    return;
  }

  await currentActivity.update({
    status,
    lastMessage: message,
    model,
  });
}

export async function stopAIActivity(): Promise<void> {
  if (!currentActivity) {
    return;
  }

  await currentActivity.end('immediate');
  currentActivity = null;
}

export function isAIActivityActive(): boolean {
  return currentActivity !== null;
}
