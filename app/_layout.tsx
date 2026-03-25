import '../polyfills';
import '../global.css';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { initCache } from '../lib/offline/cache';
import { startNetworkMonitoring, stopNetworkMonitoring } from '../lib/offline/network';
import { startAutoSync, stopAutoSync } from '../lib/supabase/offline-queue';
import { registerBackgroundSync, isSyncEnabled } from '../lib/background/health-sync';
import { isBiometricLockEnabled, authenticate } from '../lib/native/biometrics';
import { requestNotificationPermissions, scheduleHealthReminders } from '../lib/native/notifications';
import { ensureChatDB } from '../lib/chat/history';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricCheckDone, setBiometricCheckDone] = useState(false);

  // ---------- Service initialization ----------
  useEffect(() => {
    const initServices = async () => {
      // Run all independent inits in parallel; each wrapped so one failure
      // doesn't block the rest.
      await Promise.allSettled([
        initCache(),
        ensureChatDB(),
        requestNotificationPermissions().then((granted) => {
          if (granted) scheduleHealthReminders();
        }),
        isSyncEnabled().then((enabled) => {
          if (enabled) registerBackgroundSync();
        }),
      ]);
    };

    initServices();

    // Start listeners / subscriptions
    startNetworkMonitoring();
    startAutoSync();

    return () => {
      stopNetworkMonitoring();
      stopAutoSync();
    };
  }, []);

  // ---------- Biometric gate ----------
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const enabled = await isBiometricLockEnabled();
        if (!enabled) {
          setIsUnlocked(true);
        }
        // If enabled, stay locked — user taps "Unlock" button.
      } catch {
        // If check fails, don't lock the user out.
        setIsUnlocked(true);
      } finally {
        setBiometricCheckDone(true);
      }
    };

    checkBiometric();
  }, []);

  const handleUnlock = useCallback(async () => {
    try {
      const success = await authenticate();
      if (success) setIsUnlocked(true);
    } catch {
      // Authentication error — user can retry.
    }
  }, []);

  // While we haven't determined biometric state, render nothing (avoids flash).
  if (!biometricCheckDone) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Lock screen
  if (!isUnlocked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <StatusBar style="light" />
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: 2,
          }}
        >
          HUSTLE FOR LIFE
        </Text>
        <Pressable
          onPress={handleUnlock}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingHorizontal: 32,
            paddingVertical: 14,
            backgroundColor: pressed ? '#333' : '#1a1a1a',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#444',
          })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Unlock with Face ID
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="log"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="settings" />
      </Stack>
    </QueryClientProvider>
  );
}
