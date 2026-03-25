import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminder(
  title: string,
  body: string,
  trigger: { hour: number; minute: number; repeats?: boolean },
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: trigger.hour,
      minute: trigger.minute,
    },
  });
}

export async function scheduleHealthReminders(): Promise<void> {
  await cancelAllReminders();

  await scheduleReminder(
    'Morning Check-in',
    'How are you feeling? Log your mood and weight.',
    { hour: 8, minute: 0, repeats: true },
  );

  await scheduleReminder(
    'Hydration Reminder',
    "Don't forget to drink water. Log your intake.",
    { hour: 14, minute: 0, repeats: true },
  );

  await scheduleReminder(
    'Evening Wind-down',
    'Time to reflect. Log your meals and mood.',
    { hour: 21, minute: 0, repeats: true },
  );
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
