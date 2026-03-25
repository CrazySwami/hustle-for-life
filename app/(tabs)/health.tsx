import { View, Text, ScrollView } from '../../components/ui';

export default function HealthScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-2xl font-bold text-text">Health</Text>
        <Text className="text-text-muted mt-2">HealthKit integration coming soon.</Text>
      </View>
    </ScrollView>
  );
}
