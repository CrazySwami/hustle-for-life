import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

type Unit = 'kg' | 'lbs';

function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export default function WeightLogger() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<Unit>('lbs');

  const toggleUnit = () => {
    triggerHaptic();
    setUnit((prev) => (prev === 'kg' ? 'lbs' : 'kg'));
  };

  const handleSave = () => {
    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const entry = {
      type: 'weight',
      value: numericWeight,
      unit,
      valueKg: unit === 'kg' ? numericWeight : +(numericWeight * 0.453592).toFixed(2),
      timestamp: new Date().toISOString(),
    };
    console.log('[WeightLogger] Save:', JSON.stringify(entry, null, 2));
    router.back();
  };

  const numericWeight = parseFloat(weight);
  const canSave = !isNaN(numericWeight) && numericWeight > 0;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
      {/* Weight Input */}
      <View className="px-5 pt-6 items-center">
        <View className="bg-surface border border-border rounded-2xl p-6 w-full items-center">
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-4">
            Current Weight
          </Text>

          <View className="flex-row items-end mb-4">
            <TextInput
              className="text-5xl font-bold text-white text-center min-w-[150px]"
              placeholder="0"
              placeholderTextColor="#555555"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
            <Text className="text-text-muted text-xl mb-2 ml-1">{unit}</Text>
          </View>

          {/* Unit Toggle */}
          <View className="flex-row bg-background rounded-xl overflow-hidden border border-border">
            <Pressable
              onPress={() => {
                triggerHaptic();
                setUnit('kg');
              }}
              className={`px-6 py-2 ${unit === 'kg' ? 'bg-accent' : ''}`}
            >
              <Text className={`text-sm font-semibold ${unit === 'kg' ? 'text-white' : 'text-text-muted'}`}>
                kg
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setUnit('lbs');
              }}
              className={`px-6 py-2 ${unit === 'lbs' ? 'bg-accent' : ''}`}
            >
              <Text className={`text-sm font-semibold ${unit === 'lbs' ? 'text-white' : 'text-text-muted'}`}>
                lbs
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Conversion Display */}
      {canSave && (
        <View className="px-5 mt-4">
          <View className="bg-surface border border-border rounded-xl p-4">
            <Text className="text-text-muted text-xs text-center">
              {unit === 'lbs'
                ? `${(numericWeight * 0.453592).toFixed(1)} kg`
                : `${(numericWeight * 2.20462).toFixed(1)} lbs`}
            </Text>
          </View>
        </View>
      )}

      {/* Save Button */}
      <View className="px-5 mt-8">
        <Pressable
          onPress={canSave ? handleSave : undefined}
          className={`rounded-xl py-4 items-center ${canSave ? 'bg-accent' : 'bg-surface border border-border'}`}
        >
          <Text className={`font-semibold text-base ${canSave ? 'text-white' : 'text-text-dim'}`}>
            Save Weight
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
