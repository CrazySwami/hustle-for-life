import { Router } from 'express';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createScopedProvider } from '../lib/claude-code.js';

const router = Router();

// In-memory session store (maps conversationId → Claude session ID)
const sessionStore = new Map<string, string>();

router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      scope = 'default',
      conversationId,
      claudeModel = 'sonnet',
    } = req.body as {
      messages: UIMessage[];
      scope?: string;
      conversationId?: string;
      claudeModel?: 'sonnet' | 'opus' | 'haiku';
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    const provider = createScopedProvider(scope);
    const existingSessionId = conversationId ? sessionStore.get(conversationId) : undefined;
    const startTime = Date.now();

    const model = existingSessionId
      ? provider(claudeModel, { resume: existingSessionId })
      : provider(claudeModel);

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      messages: modelMessages,
      onFinish: async (completion) => {
        console.log(`[chat] ${claudeModel} responded in ${Date.now() - startTime}ms`);

        if (conversationId) {
          const sessionId = completion.providerMetadata?.['claude-code']?.sessionId as string | undefined;
          if (sessionId) {
            sessionStore.set(conversationId, sessionId);
            console.log(`[session] ${conversationId.slice(0, 8)} → ${sessionId.slice(0, 8)}`);
          }
        }
      },
    });

    const streamResponse = result.toUIMessageStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
      },
    });

    res.status(streamResponse.status);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    if (streamResponse.body) {
      const reader = streamResponse.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
          // @ts-ignore
          if (typeof res.flush === 'function') res.flush();
        }
        res.end();
      };
      pump().catch((err) => {
        console.error('[chat] stream error:', err);
        res.end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    console.error('[chat] error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// List active sessions
router.get('/sessions', (_req, res) => {
  const sessions: Record<string, string> = {};
  sessionStore.forEach((sessionId, convId) => {
    sessions[convId] = sessionId;
  });
  res.json({ sessions, count: sessionStore.size });
});

// Delete a session
router.delete('/sessions/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  sessionStore.delete(conversationId);
  res.json({ deleted: conversationId });
});

export default router;
