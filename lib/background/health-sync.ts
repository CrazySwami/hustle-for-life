import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllHealthData } from '../health/healthkit';
import { syncHealthToSupabase } from '../supabase/health-sync';
import { updateHealthWidgets } from '../widgets/updateWidgets';
import { cacheHealthData } from '../offline/cache';

const TASK_NAME = 'HEALTH_SYNC_TASK';
const LAST_SYNC_KEY = '@health_sync_last';
const SYNC_ENABLED_KEY = '@health_sync_enabled';
const SYNC_INTERVAL_SECONDS = 15 * 60;

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const healthData = await fetchAllHealthData(1);

    await Promise.allSettled([
      syncHealthToSupabase(healthData),
      cacheHealthData('all', healthData),
      updateWidgetsFromHealth(healthData),
      AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString()),
    ]);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const updateWidgetsFromHealth = (data: Awaited<ReturnType<typeof fetchAllHealthData>>) => {
  const latestSteps = data.steps.latest?.value ?? 0;
  const latestHR = data.heartRate.latest?.value ?? 0;
  const sleepHours = Math.round((data.sleep.totalMinutes / 60) * 10) / 10;
  const calories = data.activeEnergyBurned.latest?.value ?? 0;

  updateHealthWidgets({
    steps: latestSteps,
    heartRate: latestHR,
    sleep: sleepHours,
    calories,
  });
};

export const registerBackgroundSync = async (): Promise<void> => {
  const isRegistered = await isBackgroundSyncRegistered();
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: SYNC_INTERVAL_SECONDS,
    stopOnTerminate: false,
    startOnBoot: true,
  });

  await AsyncStorage.setItem(SYNC_ENABLED_KEY, 'true');
};

export const unregisterBackgroundSync = async (): Promise<void> => {
  const isRegistered = await isBackgroundSyncRegistered();
  if (!isRegistered) return;

  await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, 'false');
};

export const isBackgroundSyncRegistered = async (): Promise<boolean> => {
  return TaskManager.isTaskRegisteredAsync(TASK_NAME);
};

export const isSyncEnabled = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
  return value === 'true';
};

export const getLastSyncTime = async (): Promise<string | null> => {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
};

export const syncNow = async (): Promise<void> => {
  const healthData = await fetchAllHealthData(1);

  await Promise.allSettled([
    syncHealthToSupabase(healthData),
    cacheHealthData('all', healthData),
    updateWidgetsFromHealth(healthData),
  ]);

  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

export const getBackgroundFetchStatus = async (): Promise<string> => {
  const status = await BackgroundFetch.getStatusAsync();
  const statusMap: Record<number, string> = {
    [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted',
    [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
    [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
  };
  return statusMap[status] ?? 'Unknown';
};
