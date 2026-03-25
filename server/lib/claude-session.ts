import { query, type Query, type SDKMessage, type Options, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';

/**
 * Persistent Claude session manager.
 *
 * Uses AsyncIterable<SDKUserMessage> as prompt input, which keeps the
 * Claude process alive. Follow-up messages are pushed through the same
 * channel — no re-spawning. First message boots (~8s), follow-ups ~2-3s.
 */

interface MessageChannel {
  push: (msg: SDKUserMessage) => void;
  done: () => void;
}

function createMessageChannel(): { iterable: AsyncIterable<SDKUserMessage>; channel: MessageChannel } {
  let resolveNext: ((value: IteratorResult<SDKUserMessage>) => void) | null = null;
  const queue: SDKUserMessage[] = [];
  let isDone = false;

  const iterable: AsyncIterable<SDKUserMessage> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<SDKUserMessage>> {
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          if (isDone) {
            return Promise.resolve({ value: undefined as any, done: true });
          }
          return new Promise((resolve) => {
            resolveNext = resolve;
          });
        },
      };
    },
  };

  const channel: MessageChannel = {
    push(msg: SDKUserMessage) {
      if (resolveNext) {
        const resolve = resolveNext;
        resolveNext = null;
        resolve({ value: msg, done: false });
      } else {
        queue.push(msg);
      }
    },
    done() {
      isDone = true;
      if (resolveNext) {
        resolveNext({ value: undefined as any, done: true });
        resolveNext = null;
      }
    },
  };

  return { iterable, channel };
}

interface ActiveSession {
  query: Query;
  channel: MessageChannel;
  model: string;
  createdAt: number;
  lastUsed: number;
  isProcessing: boolean;
  responseCallbacks: StreamCallbacks | null;
}

const activeSessions = new Map<string, ActiveSession>();

// Clean up sessions idle for more than 10 minutes
const SESSION_TTL_MS = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions) {
    if (now - session.lastUsed > SESSION_TTL_MS && !session.isProcessing) {
      console.log(`[session] closing idle session ${id.slice(0, 8)}`);
      session.channel.done();
      session.query.close();
      activeSessions.delete(id);
    }
  }
}, 60000);

function createSession(conversationId: string, model: string): ActiveSession {
  const env = { ...process.env };
  delete env.CLAUDECODE;

  const { iterable, channel } = createMessageChannel();

  const opts: Options = {
    model,
    permissionMode: 'bypassPermissions',
    maxTurns: 10,
    cwd: '/home/dev/hustle-os',
    additionalDirectories: ['/home/dev/repos/hustle-for-life'],
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
    settingSources: [],
    env,
    pathToClaudeCodeExecutable: '/home/dev/services/life-api/lib/claude-wrapper.sh',
    systemPrompt: `You are Alfonso's Life OS agent — his CTO, health coach, and personal assistant. Be concise and direct. You have access to his life data at /home/dev/hustle-os/ and can read/edit files, run commands, and search the web.`,
  };

  console.log(`[session] creating ${conversationId.slice(0, 8)} model=${model}`);

  const q = query({ prompt: iterable, options: opts });

  const session: ActiveSession = {
    query: q,
    channel,
    model,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    isProcessing: false,
    responseCallbacks: null,
  };

  // Background consumer — routes messages to the current response callbacks
  (async () => {
    try {
      for await (const msg of q) {
        const cb = session.responseCallbacks;
        if (!cb) continue;

        if (msg.type === 'assistant' && 'message' in msg) {
          const content = (msg as any).message?.content;
          if (content) {
            for (const block of content) {
              if (block.type === 'text' && block.text) {
                cb.onData(block.text);
              }
            }
          }
        } else if (msg.type === 'result') {
          session.isProcessing = false;
          const resultText = (msg as any).result || '';
          cb.onDone(resultText);
          session.responseCallbacks = null;
        }
      }
    } catch (err) {
      console.error(`[session] ${conversationId.slice(0, 8)} consumer error:`, (err as Error).message);
      activeSessions.delete(conversationId);
    }
  })();

  activeSessions.set(conversationId, session);
  return session;
}

export interface StreamCallbacks {
  onData: (text: string) => void;
  onThinking: () => void;
  onDone: (fullText: string) => void;
  onError: (err: string) => void;
}

export async function sendMessage(
  conversationId: string,
  message: string,
  model: string = 'sonnet',
  callbacks: StreamCallbacks,
): Promise<void> {
  try {
    let session = activeSessions.get(conversationId);

    if (!session) {
      session = createSession(conversationId, model);
    }

    if (session.isProcessing) {
      callbacks.onError('Session is busy processing another message. Wait for it to finish.');
      return;
    }

    session.isProcessing = true;
    session.lastUsed = Date.now();
    session.responseCallbacks = callbacks;

    // Push the message through the channel — the running process picks it up
    session.channel.push({ type: 'user', content: message });

    // The background consumer will call callbacks.onData/onDone/onError

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[session] error: ${errMsg}`);
    callbacks.onError(errMsg);
  }
}

export function closeSession(conversationId: string): void {
  const session = activeSessions.get(conversationId);
  if (session) {
    session.channel.done();
    session.query.close();
    activeSessions.delete(conversationId);
  }
}

export function listActiveSessions(): Array<{ id: string; model: string; age: number; idle: number; processing: boolean }> {
  const now = Date.now();
  return Array.from(activeSessions.entries()).map(([id, s]) => ({
    id: id.slice(0, 8),
    model: s.model,
    age: Math.round((now - s.createdAt) / 1000),
    idle: Math.round((now - s.lastUsed) / 1000),
    processing: s.isProcessing,
  }));
}
