import { View, Text, ScrollView } from '../../components/ui';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-3xl font-bold text-text">Hustle for Life</Text>
        <Text className="text-text-muted mt-2">You can't hustle if you're broken.</Text>
      </View>
    </ScrollView>
  );
}
