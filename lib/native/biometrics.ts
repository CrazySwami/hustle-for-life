import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_lock_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<'face-id' | 'fingerprint' | 'none'> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face-id';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  return 'none';
}

export async function authenticate(promptMessage = 'Unlock Hustle for Life'): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}
