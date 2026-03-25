import type { AllHealthData } from '../health/healthkit';

export const syncHealthToSupabase = async (_data: AllHealthData | unknown): Promise<void> => {
  // TODO: Implement Supabase health data sync
  // Will upsert health readings to the health_data table
};
