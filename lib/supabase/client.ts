import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://fenhyfxbapybmddvhcei.supabase.co';
const SECURE_STORE_KEY = 'supabase-anon-key';

const getAnonKey = async (): Promise<string> => {
  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) return stored;
  } catch {
    // SecureStore unavailable (e.g. Expo Go on Android)
  }

  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!envKey) {
    throw new Error(
      'Supabase anon key not found. Set it in SecureStore or EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return envKey;
};

export const setAnonKey = async (key: string): Promise<void> => {
  await SecureStore.setItemAsync(SECURE_STORE_KEY, key);
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = async (): Promise<SupabaseClient> => {
  if (clientInstance) return clientInstance;

  const anonKey = await getAnonKey();

  clientInstance = createClient(SUPABASE_URL, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return clientInstance;
};

export const resetClient = (): void => {
  clientInstance = null;
};
