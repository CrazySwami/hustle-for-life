import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from '../../components/ui';
import { ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import {
  registerBackgroundSync,
  unregisterBackgroundSync,
  isBackgroundSyncRegistered,
  getLastSyncTime,
  syncNow,
  getBackgroundFetchStatus,
} from '../../lib/background/health-sync';
import { isOnline, getNetworkDetails } from '../../lib/offline/network';
import { getQueueSize } from '../../lib/offline/cache';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-text-muted tracking-widest px-5 pt-6 pb-2">
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-5 rounded-2xl border border-border bg-surface overflow-hidden">
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
  trailing,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-border">
      <Text className="text-sm text-text/70">{label}</Text>
      {trailing ?? (
        <Text className={`text-sm font-medium ${valueColor ?? 'text-text'}`}>
          {value}
        </Text>
      )}
    </View>
  );
}

const formatSyncTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function BackgroundSyncScreen() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [networkType, setNetworkType] = useState('unknown');
  const [bgStatus, setBgStatus] = useState('Unknown');
  const [pendingQueue, setPendingQueue] = useState(0);

  const loadState = useCallback(async () => {
    try {
      const [registered, syncTime, online, netDetails, fetchStatus, queueSize] = await Promise.all([
        isBackgroundSyncRegistered(),
        getLastSyncTime(),
        isOnline(),
        getNetworkDetails(),
        getBackgroundFetchStatus(),
        getQueueSize(),
      ]);

      setSyncEnabled(registered);
      setLastSync(syncTime);
      setConnected(online);
      setNetworkType(netDetails.type);
      setBgStatus(fetchStatus);
      setPendingQueue(queueSize);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleToggleSync = async (enabled: boolean) => {
    setSyncEnabled(enabled);
    try {
      if (enabled) {
        await registerBackgroundSync();
      } else {
        await unregisterBackgroundSync();
      }
    } catch {
      setSyncEnabled(!enabled);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncNow();
      const syncTime = await getLastSyncTime();
      setLastSync(syncTime);
      const queueSize = await getQueueSize();
      setPendingQueue(queueSize);
    } catch {} finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-2">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-accent text-sm">{'\u2190'} Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-text">Background Sync</Text>
        <Text className="text-text-muted mt-2 text-sm">
          Health data syncs automatically in the background
        </Text>
      </View>

      {/* Sync Toggle */}
      <SectionHeader title="BACKGROUND SYNC" />
      <Card>
        <View className="px-5 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-text">Enable Background Sync</Text>
              <Text className="text-xs text-text-muted mt-1">
                Syncs health data every 15 minutes when app is backgrounded
              </Text>
            </View>
            <Switch
              value={syncEnabled}
              onValueChange={handleToggleSync}
              trackColor={{ false: '#2A2A2A', true: '#1A3A1A' }}
              thumbColor={syncEnabled ? '#30D158' : '#888'}
              ios_backgroundColor="#2A2A2A"
            />
          </View>
        </View>
        <Row label="Frequency" value="Every 15 minutes" />
        <Row label="Background Fetch" value={bgStatus} valueColor={bgStatus === 'Available' ? 'text-green' : 'text-red'} />
      </Card>

      {/* Sync Status */}
      <SectionHeader title="SYNC STATUS" />
      <Card>
        <Row
          label="Last Sync"
          value={lastSync ? formatSyncTime(lastSync) : 'Never'}
          valueColor={lastSync ? 'text-text' : 'text-text-muted'}
        />
        <Row
          label="Pending Operations"
          value={String(pendingQueue)}
          valueColor={pendingQueue > 0 ? 'text-amber' : 'text-text-muted'}
        />
        <View className="px-5 py-4">
          <Pressable
            onPress={handleSyncNow}
            disabled={syncing}
            className="bg-accent/10 rounded-xl py-3 items-center"
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Text className="text-accent font-semibold text-sm">Sync Now</Text>
            )}
          </Pressable>
        </View>
      </Card>

      {/* Network */}
      <SectionHeader title="NETWORK" />
      <Card>
        <Row
          label="Status"
          trailing={
            <View className="flex-row items-center">
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  connected ? 'bg-green' : 'bg-red'
                }`}
              />
              <Text
                className={`text-sm font-medium ${
                  connected ? 'text-green' : 'text-red'
                }`}
              >
                {connected ? 'Online' : 'Offline'}
              </Text>
            </View>
          }
        />
        <Row label="Connection Type" value={networkType} />
        {!connected && (
          <View className="px-5 py-3">
            <Text className="text-xs text-text-muted">
              Data is being cached locally and will sync when connectivity returns.
            </Text>
          </View>
        )}
      </Card>

      {/* Info */}
      <SectionHeader title="INFO" />
      <Card>
        <View className="px-5 py-4">
          <Text className="text-sm text-text/70 leading-5">
            Background sync fetches your latest health data from HealthKit and pushes it to Supabase. When offline, data is cached locally in SQLite and queued for sync when you reconnect.
          </Text>
          <Text className="text-xs text-text-muted mt-3 leading-5">
            iOS may throttle background fetch frequency based on app usage patterns. The 15-minute interval is a minimum request — actual frequency depends on system conditions.
          </Text>
        </View>
      </Card>

      <View className="h-10" />
    </ScrollView>
  );
}
