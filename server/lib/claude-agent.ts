import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

const CLAUDE_PATH = '/home/dev/.local/bin/claude';
const DEFAULT_CWD = '/home/dev/hustle-os';

// Session store: conversationId → Claude session UUID
const sessions = new Map<string, string>();

export function getSession(conversationId: string): { sessionId: string; isNew: boolean } {
  const existing = sessions.get(conversationId);
  if (existing) return { sessionId: existing, isNew: false };
  const sessionId = randomUUID();
  sessions.set(conversationId, sessionId);
  return { sessionId, isNew: true };
}

export function resetSession(conversationId: string): void {
  sessions.delete(conversationId);
}

export function listSessions(): Record<string, string> {
  const result: Record<string, string> = {};
  sessions.forEach((sid, cid) => { result[cid] = sid; });
  return result;
}

interface StreamOptions {
  conversationId: string;
  message: string;
  model?: 'sonnet' | 'opus' | 'haiku';
  cwd?: string;
  onData: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: string) => void;
}

/**
 * Spawn Claude Code CLI and stream output.
 * Uses --session-id for new conversations, --resume for continuing.
 * Process spawns per message but session context persists on disk.
 */
export function streamClaude(opts: StreamOptions): { abort: () => void } {
  const { conversationId, message, model = 'sonnet', cwd = DEFAULT_CWD } = opts;
  const { sessionId, isNew } = getSession(conversationId);

  const args = [
    '-p', message,
    '--dangerously-skip-permissions',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', model,
    '--max-turns', '10',
  ];

  if (isNew) {
    args.push('--session-id', sessionId);
  } else {
    args.push('--resume', sessionId);
  }

  console.log(`[claude] ${isNew ? 'NEW' : 'RESUME'} session ${sessionId.slice(0, 8)} model=${model}`);

  const proc = spawn(CLAUDE_PATH, args, {
    cwd,
    env: (() => {
      const env = { ...process.env, HOME: '/home/dev', USER: 'dev' };
      // CRITICAL: Delete CLAUDECODE or Claude CLI refuses to spawn
      // (thinks it's nested inside another Claude Code session)
      delete env.CLAUDECODE;
      return env;
    })(),
    timeout: 300000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let fullText = '';
  let stderr = '';

  let buffer = '';

  proc.stdout.on('data', (data: Buffer) => {
    buffer += data.toString();

    // Process complete JSON lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'assistant' && parsed.message?.content) {
          // Assistant message with content blocks
          for (const block of parsed.message.content) {
            if (block.type === 'text' && block.text) {
              fullText += block.text;
              opts.onData(block.text);
            }
          }
        } else if (parsed.type === 'result' && parsed.subtype === 'success') {
          // Capture session ID from result
          if (parsed.session_id) {
            sessions.set(opts.conversationId, parsed.session_id);
            console.log(`[claude] session saved: ${opts.conversationId.slice(0, 8)} → ${parsed.session_id.slice(0, 8)}`);
          }
          // If we got no text from assistant messages, use result text
          if (parsed.result && !fullText) {
            fullText = parsed.result;
            opts.onData(parsed.result);
          }
        }
        // Ignore system, hook, rate_limit events
      } catch {
        // Not JSON — skip
      }
    }
  });

  proc.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  proc.on('close', (code, signal) => {
    if ((code !== 0 || signal) && !fullText) {
      console.error(`[claude] exited code=${code} signal=${signal}, stderr: ${stderr.slice(0, 300)}`);

      // If resume failed, retry with fresh session
      if (!isNew) {
        console.log(`[claude] resume failed, retrying with fresh session`);
        sessions.delete(conversationId);
        streamClaude(opts);
        return;
      }

      opts.onError(stderr || 'Claude process failed');
    } else {
      opts.onDone(fullText);
    }
  });

  proc.on('error', (err) => {
    opts.onError(err.message);
  });

  proc.stdin.end();

  return {
    abort: () => {
      proc.kill('SIGTERM');
    },
  };
}
