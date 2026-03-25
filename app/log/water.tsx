import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { syncWater } from '../../lib/supabase/health-sync';
import { haptic } from '../../lib/native/haptics';

const QUICK_AMOUNTS = [
  { label: '250ml', value: 250 },
  { label: '500ml', value: 500 },
  { label: '750ml', value: 750 },
  { label: '1L', value: 1000 },
] as const;

function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export default function WaterLogger() {
  const router = useRouter();
  const [todayTotal, setTodayTotal] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const addAmount = (ml: number) => {
    triggerHaptic();
    setTodayTotal((prev) => prev + ml);
  };

  const addCustom = () => {
    const ml = parseInt(customAmount, 10);
    if (isNaN(ml) || ml <= 0) return;
    addAmount(ml);
    setCustomAmount('');
  };

  const handleSave = async () => {
    if (todayTotal <= 0 || saving) return;
    setSaving(true);
    setErrorMsg('');

    try {
      await syncWater(todayTotal);
      haptic.success();
      router.back();
    } catch (err) {
      haptic.error();
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save water log');
      setSaving(false);
    }
  };

  const progressPercent = Math.min((todayTotal / 3000) * 100, 100);
  const canSave = todayTotal > 0 && !saving;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
      {/* Today's Total */}
      <View className="px-5 pt-6 items-center">
        <View className="bg-surface border border-border rounded-2xl p-6 w-full items-center">
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-2">
            Today's Intake
          </Text>
          <Text className="text-5xl font-bold text-white mb-1">
            {todayTotal >= 1000
              ? `${(todayTotal / 1000).toFixed(1)}L`
              : `${todayTotal}ml`}
          </Text>
          <Text className="text-text-muted text-sm mb-4">Goal: 3.0L</Text>

          {/* Progress Bar */}
          <View className="w-full h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressPercent >= 100 ? '#34C759' : '#007AFF',
              }}
            />
          </View>
          <Text className="text-text-dim text-xs mt-2">{Math.round(progressPercent)}%</Text>
        </View>
      </View>

      {/* Quick Add */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-4">Quick Add</Text>
        <View className="flex-row justify-between gap-3">
          {QUICK_AMOUNTS.map((amount) => (
            <Pressable
              key={amount.value}
              onPress={() => addAmount(amount.value)}
              className="flex-1 bg-surface border border-border rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-sm">{amount.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Custom Amount */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-3">Custom Amount</Text>
        <View className="flex-row gap-3">
          <TextInput
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm"
            placeholder="Enter ml..."
            placeholderTextColor="#555555"
            keyboardType="numeric"
            value={customAmount}
            onChangeText={setCustomAmount}
          />
          <Pressable
            onPress={addCustom}
            className="bg-surface border border-border rounded-xl px-5 py-3 justify-center"
          >
            <Text className="text-accent font-semibold text-sm">Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Reset */}
      {todayTotal > 0 && (
        <View className="px-5 mt-4">
          <Pressable
            onPress={() => {
              triggerHaptic();
              setTodayTotal(0);
            }}
          >
            <Text className="text-text-dim text-xs text-center">Reset today's total</Text>
          </Pressable>
        </View>
      )}

      {/* Error Display */}
      {errorMsg !== '' && (
        <View className="px-5 mt-4">
          <Text className="text-accent text-sm text-center">{errorMsg}</Text>
        </View>
      )}

      {/* Save Button */}
      <View className="px-5 mt-8">
        <Pressable
          onPress={canSave ? handleSave : undefined}
          className={`rounded-xl py-4 items-center ${canSave ? 'bg-accent' : 'bg-surface border border-border'}`}
        >
          <Text className={`font-semibold text-base ${canSave ? 'text-white' : 'text-text-dim'}`}>
            {saving ? 'Saving...' : 'Save Water Log'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
