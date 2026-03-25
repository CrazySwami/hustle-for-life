import * as SQLite from 'expo-sqlite';

const DB_NAME = 'hustle_cache.db';

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
};

export const initCache = async (): Promise<void> => {
  const database = await getDb();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS health_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      attempted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_health_cache_type ON health_cache(type);
    CREATE INDEX IF NOT EXISTS idx_health_cache_recorded ON health_cache(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);
};

export const cacheHealthData = async (type: string, data: unknown): Promise<void> => {
  const database = await getDb();
  const now = new Date().toISOString();
  const serialized = JSON.stringify(data);

  await database.runAsync(
    'INSERT INTO health_cache (type, data, recorded_at) VALUES (?, ?, ?)',
    [type, serialized, now],
  );
};

export interface CachedHealthRecord {
  readonly id: number;
  readonly type: string;
  readonly data: unknown;
  readonly recordedAt: string;
  readonly createdAt: string;
}

export const getCachedData = async (type: string, days: number = 7): Promise<CachedHealthRecord[]> => {
  const database = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await database.getAllAsync<{
    id: number;
    type: string;
    data: string;
    recorded_at: string;
    created_at: string;
  }>(
    'SELECT * FROM health_cache WHERE type = ? AND recorded_at >= ? ORDER BY recorded_at DESC',
    [type, cutoff.toISOString()],
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    data: JSON.parse(row.data),
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
  }));
};

export interface SyncQueueItem {
  readonly id: number;
  readonly operation: string;
  readonly data: unknown;
  readonly status: string;
  readonly createdAt: string;
}

export const addToSyncQueue = async (operation: string, data: unknown): Promise<void> => {
  const database = await getDb();
  const serialized = JSON.stringify(data);

  await database.runAsync(
    'INSERT INTO sync_queue (operation, data) VALUES (?, ?)',
    [operation, serialized],
  );
};

export const getPendingQueueItems = async (): Promise<SyncQueueItem[]> => {
  const database = await getDb();

  const rows = await database.getAllAsync<{
    id: number;
    operation: string;
    data: string;
    status: string;
    created_at: string;
  }>(
    'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC',
    ['pending'],
  );

  return rows.map((row) => ({
    id: row.id,
    operation: row.operation,
    data: JSON.parse(row.data),
    status: row.status,
    createdAt: row.created_at,
  }));
};

export const processSyncQueue = async (
  processor: (item: SyncQueueItem) => Promise<boolean>,
): Promise<{ processed: number; failed: number }> => {
  const database = await getDb();
  const items = await getPendingQueueItems();
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    const now = new Date().toISOString();
    try {
      const success = await processor(item);
      const newStatus = success ? 'completed' : 'failed';
      await database.runAsync(
        'UPDATE sync_queue SET status = ?, attempted_at = ? WHERE id = ?',
        [newStatus, now, item.id],
      );
      if (success) processed++;
      else failed++;
    } catch {
      await database.runAsync(
        'UPDATE sync_queue SET status = ?, attempted_at = ? WHERE id = ?',
        ['failed', now, item.id],
      );
      failed++;
    }
  }

  return { processed, failed };
};

export const clearOldCache = async (olderThanDays: number = 30): Promise<number> => {
  const database = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const cutoffStr = cutoff.toISOString();

  const healthResult = await database.runAsync(
    'DELETE FROM health_cache WHERE created_at < ?',
    [cutoffStr],
  );

  const queueResult = await database.runAsync(
    "DELETE FROM sync_queue WHERE status IN ('completed', 'failed') AND created_at < ?",
    [cutoffStr],
  );

  return healthResult.changes + queueResult.changes;
};

export const getQueueSize = async (): Promise<number> => {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'",
  );
  return result?.count ?? 0;
};
