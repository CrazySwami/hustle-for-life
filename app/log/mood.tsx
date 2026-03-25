import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

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

  const handleSave = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const entry = {
      type: 'mood',
      mood: selectedMood,
      moodLabel: MOODS.find((m) => m.value === selectedMood)?.label,
      energy,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };
    console.log('[MoodLogger] Save:', JSON.stringify(entry, null, 2));
    router.back();
  };

  const canSave = selectedMood !== null;

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

      {/* Save Button */}
      <View className="px-5 mt-8">
        <Pressable
          onPress={canSave ? handleSave : undefined}
          className={`rounded-xl py-4 items-center ${canSave ? 'bg-accent' : 'bg-surface border border-border'}`}
        >
          <Text className={`font-semibold text-base ${canSave ? 'text-white' : 'text-text-dim'}`}>
            Save Mood
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
