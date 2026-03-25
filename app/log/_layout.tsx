import { Stack } from 'expo-router';

export default function LogLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="mood" options={{ title: 'Log Mood' }} />
      <Stack.Screen name="meal" options={{ title: 'Log Meal' }} />
      <Stack.Screen name="water" options={{ title: 'Log Water' }} />
      <Stack.Screen name="weight" options={{ title: 'Log Weight' }} />
    </Stack>
  );
}
