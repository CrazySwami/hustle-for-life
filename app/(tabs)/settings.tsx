import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from '../../components/ui';
import { Linking, ActivityIndicator } from 'react-native';

// ---------- constants ----------
const BACKEND_URL = 'https://life.hustletogether.com';
const APP_VERSION = '1.0.0';

const LINKS = [
  { label: 'GitHub Repository', url: 'https://github.com/CrazySwami/hustle-for-life' },
  { label: 'Web Dashboard', url: BACKEND_URL },
  { label: 'Life OS Repo', url: 'https://github.com/CrazySwami/life-os' },
];

// ---------- helpers ----------

interface HealthStatus {
  online: boolean;
  uptime?: string;
  loading: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

function useBackendHealth(): HealthStatus {
  const [state, setState] = useState<HealthStatus>({ online: false, loading: true });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setState({
            online: true,
            uptime: data.uptime ? formatUptime(data.uptime) : undefined,
            loading: false,
          });
        } else {
          setState({ online: false, loading: false });
        }
      } catch {
        if (mounted) setState({ online: false, loading: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  return state;
}

function useModels(): { models: ModelInfo[]; loading: boolean } {
  const [state, setState] = useState<{ models: ModelInfo[]; loading: boolean }>({
    models: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/models`, { method: 'GET' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          const models: ModelInfo[] = Array.isArray(data)
            ? data
            : Array.isArray(data.models)
            ? data.models
            : [];
          setState({ models, loading: false });
        } else {
          setState({ models: [], loading: false });
        }
      } catch {
        if (mounted) setState({ models: [], loading: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  return state;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------- section components ----------

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-text-muted tracking-widest px-5 pt-6 pb-2">
      {title}
    </Text>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-5 rounded-2xl border border-border bg-surface overflow-hidden">
      {children}
    </View>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      className="flex-row items-center justify-between px-5 py-3.5 border-b border-border"
      onPress={() => Linking.openURL(url)}
    >
      <Text className="text-sm text-accent">{label}</Text>
      <Text className="text-text-dim text-xs">{'\u2197'}</Text>
    </Pressable>
  );
}

// ---------- main screen ----------

export default function SettingsScreen() {
  const health = useBackendHealth();
  const { models, loading: modelsLoading } = useModels();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-2">
        <Text className="text-2xl font-bold text-text">Settings</Text>
        <Text className="text-text-muted mt-2 text-sm">
          System info and configuration
        </Text>
      </View>

      {/* App Info */}
      <SectionHeader title="APP INFO" />
      <Card>
        <Row label="Version" value={APP_VERSION} />
        <Row label="Platform" value="Expo SDK 52 + React Native" />
        <Row label="Backend URL" value={BACKEND_URL.replace('https://', '')} />
      </Card>

      {/* Backend Status */}
      <SectionHeader title="BACKEND STATUS" />
      <Card>
        <Row
          label="Status"
          trailing={
            health.loading ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <View className="flex-row items-center">
                <View
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${
                    health.online ? 'bg-green' : 'bg-red'
                  }`}
                />
                <Text
                  className={`text-sm font-medium ${
                    health.online ? 'text-green' : 'text-red'
                  }`}
                >
                  {health.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            )
          }
        />
        {health.online && health.uptime && (
          <Row label="Uptime" value={health.uptime} />
        )}
      </Card>

      {/* AI Models */}
      <SectionHeader title="AI MODELS" />
      <Card>
        {modelsLoading ? (
          <View className="px-5 py-4 items-center">
            <ActivityIndicator size="small" color="#FF3B30" />
          </View>
        ) : models.length > 0 ? (
          models.map((m, i) => (
            <Row
              key={m.id ?? i}
              label={m.name || m.id}
              value={m.provider}
              valueColor="text-text-muted"
            />
          ))
        ) : (
          <>
            <Row label="Claude Sonnet 4.6" value="Anthropic" valueColor="text-text-muted" />
            <Row label="GPT 5.3" value="OpenAI" valueColor="text-text-muted" />
            <Row label="Gemini 3.1" value="Google" valueColor="text-text-muted" />
            <Row label="Claude Code" value="Primary" valueColor="text-accent" />
          </>
        )}
      </Card>

      {/* Links */}
      <SectionHeader title="LINKS" />
      <Card>
        {LINKS.map((link) => (
          <LinkRow key={link.url} label={link.label} url={link.url} />
        ))}
      </Card>

      {/* About */}
      <SectionHeader title="ABOUT" />
      <Card>
        <View className="px-5 py-5">
          <Text className="text-sm text-text/70 leading-5">
            Hustle for Life is an AI-powered life management app built for people who refuse to
            sacrifice their health for productivity. It combines real-time health tracking,
            AI coaching via Claude Code, and a personal knowledge base backed by GitHub.
          </Text>
          <Text className="text-sm text-text-muted mt-3 leading-5">
            "You can't hustle if you're broken."
          </Text>
        </View>
      </Card>

      {/* Footer */}
      <View className="items-center py-8">
        <Text className="text-text-dim text-xs">
          Hustle for Life v{APP_VERSION}
        </Text>
      </View>
    </ScrollView>
  );
}
