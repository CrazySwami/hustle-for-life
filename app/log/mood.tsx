import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { syncMood } from '../../lib/supabase/health-sync';
import { commitMoodLog } from '../../lib/github/health-journal';
import { haptic } from '../../lib/native/haptics';

const MOODS = [
  { label: 'Great', emoji: '\uD83D\uDE04', value: 5 },
  { label: 'Good', emoji: '\uD83D\uDE42', value: 4 },
  { label: 'Okay', emoji: '\uD83D\uDE10', value: 3 },
  { label: 'Low', emoji: '\uD83D\uDE14', value: 2 },
  { label: 'Bad', emoji: '\uD83D\uDE1E', value: 1 },
] as const;

const ENERGY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export default function MoodLogger() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    if (selectedMood === null || saving) return;
    setSaving(true);
    setErrorMsg('');

    const moodLabel = MOODS.find((m) => m.value === selectedMood)?.label ?? 'Okay';
    const trimmedNotes = notes.trim() || undefined;

    try {
      await Promise.all([
        syncMood(selectedMood, trimmedNotes),
        commitMoodLog(new Date(), moodLabel, energy ?? 5, trimmedNotes),
      ]);
      haptic.success();
      router.back();
    } catch (err) {
      haptic.error();
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save mood');
      setSaving(false);
    }
  };

  const canSave = selectedMood !== null && !saving;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
      {/* Mood Selection */}
      <View className="px-5 pt-6">
        <Text className="text-text font-semibold text-base mb-4">How are you feeling?</Text>
        <View className="flex-row justify-between">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.value;
            return (
              <Pressable
                key={mood.value}
                onPress={() => {
                  triggerHaptic();
                  setSelectedMood(mood.value);
                }}
                className={`items-center rounded-2xl py-3 px-2 flex-1 mx-1 ${
                  isSelected ? 'bg-surface border border-accent' : 'bg-surface border border-border'
                }`}
              >
                <Text className="text-3xl mb-1">{mood.emoji}</Text>
                <Text
                  className={`text-xs font-medium ${isSelected ? 'text-accent' : 'text-text-muted'}`}
                >
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Energy Level */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-2">Energy Level</Text>
        <Text className="text-text-muted text-xs mb-4">
          {energy !== null ? `${energy}/10` : 'Tap to select'}
        </Text>
        <View className="flex-row justify-between">
          {ENERGY_LEVELS.map((level) => {
            const isSelected = energy === level;
            const isFilled = energy !== null && level <= energy;
            return (
              <Pressable
                key={level}
                onPress={() => {
                  triggerHaptic();
                  setEnergy(level);
                }}
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isSelected
                    ? 'bg-green border-2 border-green'
                    : isFilled
                      ? 'bg-green/30 border border-green/50'
                      : 'bg-surface border border-border'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected || isFilled ? 'text-white' : 'text-text-dim'
                  }`}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-3">Notes (optional)</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm min-h-[100px]"
          placeholder="How's your day going?"
          placeholderTextColor="#555555"
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

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
            {saving ? 'Saving...' : 'Save Mood'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
