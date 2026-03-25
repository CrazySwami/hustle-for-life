import * as SQLite from 'expo-sqlite';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getSupabaseClient } from './client';

const DB_NAME = 'hustle-offline-queue.db';

export interface QueuedOperation {
  readonly id?: number;
  readonly table: string;
  readonly method: 'upsert' | 'insert';
  readonly payload: string; // JSON-stringified
  readonly createdAt: string;
  readonly retries: number;
}

const MAX_RETRIES = 5;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      retries INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
};

export const enqueue = async (
  table: string,
  method: 'upsert' | 'insert',
  payload: Record<string, unknown> | Record<string, unknown>[]
): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO sync_queue (table_name, method, payload) VALUES (?, ?, ?)',
    [table, method, JSON.stringify(payload)]
  );
};

export const processQueue = async (): Promise<{ processed: number; failed: number }> => {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    table_name: string;
    method: string;
    payload: string;
    retries: number;
  }>('SELECT * FROM sync_queue WHERE retries < ? ORDER BY id ASC LIMIT 50', [MAX_RETRIES]);

  if (rows.length === 0) return { processed: 0, failed: 0 };

  const supabase = await getSupabaseClient();
  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const data = JSON.parse(row.payload);
      const query =
        row.method === 'upsert'
          ? supabase.from(row.table_name).upsert(data)
          : supabase.from(row.table_name).insert(data);

      const { error } = await query;

      if (error) throw error;

      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [row.id]);
      processed++;
    } catch {
      await db.runAsync(
        'UPDATE sync_queue SET retries = retries + 1 WHERE id = ?',
        [row.id]
      );
      failed++;
    }
  }

  // Clean up permanently failed items
  await db.runAsync('DELETE FROM sync_queue WHERE retries >= ?', [MAX_RETRIES]);

  return { processed, failed };
};

export const getQueueSize = async (): Promise<number> => {
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE retries < ?',
    [MAX_RETRIES]
  );
  return result?.count ?? 0;
};

export const clearQueue = async (): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue');
};

let unsubscribeNetInfo: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export const startAutoSync = (): void => {
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      processQueue();
    }
  });

  const handleAppState = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      processQueue();
    }
  };
  appStateSubscription = AppState.addEventListener('change', handleAppState);
};

export const stopAutoSync = (): void => {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
};
