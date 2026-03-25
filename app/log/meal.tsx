import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '../../components/ui';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
type MealType = (typeof MEAL_TYPES)[number];

const STARS = [1, 2, 3, 4, 5] as const;

function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export default function MealLogger() {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [description, setDescription] = useState('');
  const [quality, setQuality] = useState<number | null>(null);

  const handleSave = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const entry = {
      type: 'meal',
      mealType,
      description: description.trim() || undefined,
      quality,
      timestamp: new Date().toISOString(),
    };
    console.log('[MealLogger] Save:', JSON.stringify(entry, null, 2));
    router.back();
  };

  const canSave = mealType !== null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
      {/* Meal Type */}
      <View className="px-5 pt-6">
        <Text className="text-text font-semibold text-base mb-4">Meal Type</Text>
        <View className="flex-row flex-wrap gap-3">
          {MEAL_TYPES.map((type) => {
            const isSelected = mealType === type;
            return (
              <Pressable
                key={type}
                onPress={() => {
                  triggerHaptic();
                  setMealType(type);
                }}
                className={`rounded-xl py-3 px-5 ${
                  isSelected ? 'bg-accent' : 'bg-surface border border-border'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-text-muted'}`}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Description */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-3">What did you eat?</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm min-h-[80px]"
          placeholder="Describe your meal..."
          placeholderTextColor="#555555"
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Quality Rating */}
      <View className="px-5 mt-8">
        <Text className="text-text font-semibold text-base mb-2">Quality Rating</Text>
        <Text className="text-text-muted text-xs mb-4">
          {quality !== null ? `${quality}/5 stars` : 'Tap to rate'}
        </Text>
        <View className="flex-row gap-4">
          {STARS.map((star) => {
            const isFilled = quality !== null && star <= quality;
            return (
              <Pressable
                key={star}
                onPress={() => {
                  triggerHaptic();
                  setQuality(star);
                }}
              >
                <Text className={`text-4xl ${isFilled ? 'text-orange' : 'text-text-dim'}`}>
                  {isFilled ? '\u2605' : '\u2606'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Save Button */}
      <View className="px-5 mt-8">
        <Pressable
          onPress={canSave ? handleSave : undefined}
          className={`rounded-xl py-4 items-center ${canSave ? 'bg-accent' : 'bg-surface border border-border'}`}
        >
          <Text className={`font-semibold text-base ${canSave ? 'text-white' : 'text-text-dim'}`}>
            Save Meal
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
