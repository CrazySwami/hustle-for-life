import { View, Text, ScrollView } from '../../components/ui';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16">
        <Text className="text-2xl font-bold text-text">Settings</Text>
        <Text className="text-text-muted mt-2">Model selection and preferences.</Text>
      </View>
    </ScrollView>
  );
}
