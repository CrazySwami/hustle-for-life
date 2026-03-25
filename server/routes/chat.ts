import { Router } from 'express';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createScopedProvider } from '../lib/claude-code.js';
import { models, type ModelId } from '../lib/gateway.js';

const router = Router();

// In-memory session store (maps conversationId → Claude session ID)
// TODO: persist to disk/Supabase for survival across restarts
const sessionStore = new Map<string, string>();

router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      model: modelId = 'claude-code',
      scope = 'default',
      conversationId,
      claudeModel = 'sonnet',
    } = req.body as {
      messages: UIMessage[];
      model?: string;
      scope?: string;
      conversationId?: string;
      claudeModel?: 'sonnet' | 'opus' | 'haiku';
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    let model;
    if (modelId === 'claude-code') {
      const provider = createScopedProvider(scope);

      // Resume session if we have one for this conversation
      const existingSessionId = conversationId ? sessionStore.get(conversationId) : undefined;

      if (existingSessionId) {
        model = provider(claudeModel, { resume: existingSessionId });
      } else {
        model = provider(claudeModel);
      }
    } else if (modelId in models && modelId !== 'claude-code') {
      const factory = models[modelId as ModelId];
      if (factory) model = factory();
    }

    if (!model) {
      res.status(400).json({ error: `Unknown model: ${modelId}` });
      return;
    }

    // Convert UIMessage[] from useChat to ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      messages: modelMessages,
      onFinish: async (completion) => {
        // Capture the Claude Code session ID from provider metadata
        if (modelId === 'claude-code' && conversationId) {
          const sessionId = completion.providerMetadata?.['claude-code']?.sessionId as string | undefined;
          if (sessionId) {
            sessionStore.set(conversationId, sessionId);
            console.log(`[session] ${conversationId} → ${sessionId}`);
          }
        }
      },
    });

    // Use toUIMessageStreamResponse for compatibility with useChat + DefaultChatTransport
    const streamResponse = result.toUIMessageStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
      },
    });

    // Pipe the Web Response to Express response with streaming headers
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

// Delete a session (start fresh)
router.delete('/sessions/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  sessionStore.delete(conversationId);
  res.json({ deleted: conversationId });
});

export default router;
