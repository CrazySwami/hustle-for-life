import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const haptic = {
  light: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: () => {
    if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  error: () => {
    if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
  selection: () => {
    if (isIOS) Haptics.selectionAsync().catch(() => {});
  },
};
