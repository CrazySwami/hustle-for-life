import { Link, Stack } from 'expo-router';
import { View, Text } from '../components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text text-xl">Page not found.</Text>
        <Link href="/" className="mt-4">
          <Text className="text-accent">Go home</Text>
        </Link>
      </View>
    </>
  );
}
