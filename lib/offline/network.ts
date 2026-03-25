import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { processSyncQueue } from './cache';
import { syncAllHealthData } from '../supabase/health-sync';

type NetworkChangeCallback = (isConnected: boolean) => void;

let subscription: NetInfoSubscription | null = null;
let lastKnownState: boolean | null = null;
const listeners = new Set<NetworkChangeCallback>();

const handleNetworkChange = async (state: NetInfoState) => {
  const connected = state.isConnected ?? false;
  const wasOffline = lastKnownState === false;
  lastKnownState = connected;

  listeners.forEach((callback) => {
    try {
      callback(connected);
    } catch {}
  });

  if (connected && wasOffline) {
    await processQueueOnReconnect();
  }
};

const processQueueOnReconnect = async () => {
  try {
    await processSyncQueue(async (item) => {
      if (item.operation === 'health_sync') {
        await syncAllHealthData(item.data as import('../health/healthkit').AllHealthData);
        return true;
      }
      return false;
    });
  } catch {}
};

export const startNetworkMonitoring = (): void => {
  if (subscription) return;
  subscription = NetInfo.addEventListener(handleNetworkChange);
};

export const stopNetworkMonitoring = (): void => {
  if (subscription) {
    subscription();
    subscription = null;
  }
  listeners.clear();
  lastKnownState = null;
};

export const onNetworkChange = (callback: NetworkChangeCallback): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const isOnline = async (): Promise<boolean> => {
  if (lastKnownState !== null) return lastKnownState;
  const state = await NetInfo.fetch();
  lastKnownState = state.isConnected ?? false;
  return lastKnownState;
};

export const getNetworkDetails = async (): Promise<{
  isConnected: boolean;
  type: string;
  isWifi: boolean;
}> => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    type: state.type,
    isWifi: state.type === 'wifi',
  };
};
