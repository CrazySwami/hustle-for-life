import { View, Text, ScrollView } from '../../components/ui';

export default function HealthScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-2">
        <Text className="text-2xl font-bold text-text">Health</Text>
        <Text className="text-text-muted mt-2 text-sm">Track. Recover. Perform.</Text>
      </View>

      {/* Placeholder card */}
      <View className="mx-5 mt-6 rounded-2xl border border-border bg-surface p-6 items-center">
        <Text className="text-text-dim text-5xl mb-4">{'\u2665'}</Text>
        <Text className="text-text font-bold text-lg mb-2">Coming in Sprint 2</Text>
        <Text className="text-text-muted text-sm text-center leading-5 px-4">
          HealthKit integration, trend cards, manual logging, and real-time sync — all landing soon.
        </Text>
      </View>

      {/* Preview items */}
      <View className="mx-5 mt-4 rounded-2xl border border-border bg-surface overflow-hidden">
        <PreviewRow label="Steps & Activity" />
        <PreviewRow label="Heart Rate & HRV" />
        <PreviewRow label="Sleep Analysis" />
        <PreviewRow label="Blood Pressure" />
        <PreviewRow label="Weight & Body Comp" />
        <PreviewRow label="Mood & Energy" last />
      </View>

      <View className="items-center py-8">
        <Text className="text-text-dim text-xs">Powered by HealthKit</Text>
      </View>
    </ScrollView>
  );
}

function PreviewRow({ label, last }: { label: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between px-5 py-3.5 ${last ? '' : 'border-b border-border'}`}>
      <Text className="text-sm text-text/60">{label}</Text>
      <Text className="text-xs text-text-dim">Soon</Text>
    </View>
  );
}
