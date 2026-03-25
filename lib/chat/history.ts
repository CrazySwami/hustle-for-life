import * as SQLite from 'expo-sqlite';

// --------------- Types ---------------

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

// --------------- Database ---------------

let db: SQLite.SQLiteDatabase | null = null;

const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('hustle-chat.db');
  await initDB(db);
  return db;
};

const initDB = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversationId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversationId, createdAt);
  `);
};

// --------------- Conversations ---------------

export const saveConversation = async (
  id: string,
  title: string,
): Promise<void> => {
  const database = await getDB();
  const now = Date.now();

  await database.runAsync(
    `INSERT INTO conversations (id, title, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = ?, updatedAt = ?`,
    id, title, now, now, title, now,
  );
};

export const getConversations = async (
  limit = 50,
): Promise<Conversation[]> => {
  const database = await getDB();

  const rows = await database.getAllAsync<
    Conversation & { lastMessagePreview: string | null }
  >(
    `SELECT
       c.id, c.title, c.createdAt, c.updatedAt,
       (SELECT content FROM messages
        WHERE conversationId = c.id
        ORDER BY createdAt DESC LIMIT 1) AS lastMessagePreview
     FROM conversations c
     ORDER BY c.updatedAt DESC
     LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    ...row,
    lastMessagePreview: row.lastMessagePreview ?? undefined,
  }));
};

export const deleteConversation = async (id: string): Promise<void> => {
  const database = await getDB();
  await database.runAsync('DELETE FROM messages WHERE conversationId = ?', id);
  await database.runAsync('DELETE FROM conversations WHERE id = ?', id);
};

// --------------- Messages ---------------

export const saveMessage = async (
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
): Promise<string> => {
  const database = await getDB();
  const id = generateId();
  const now = Date.now();

  await database.runAsync(
    `INSERT INTO messages (id, conversationId, role, content, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    id, conversationId, role, content, now,
  );

  // Touch conversation updatedAt
  await database.runAsync(
    'UPDATE conversations SET updatedAt = ? WHERE id = ?',
    now, conversationId,
  );

  return id;
};

export const getMessages = async (
  conversationId: string,
): Promise<Message[]> => {
  const database = await getDB();

  return database.getAllAsync<Message>(
    `SELECT id, conversationId, role, content, createdAt
     FROM messages
     WHERE conversationId = ?
     ORDER BY createdAt ASC`,
    conversationId,
  );
};

// --------------- Helpers ---------------

export const generateTitle = (messages: Array<{ role: string; content: string }>): string => {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const text = firstUserMessage.content.trim();
  if (text.length <= 40) return text;
  return `${text.slice(0, 40)}...`;
};

export const generateConversationId = (): string => generateId();

const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
};
