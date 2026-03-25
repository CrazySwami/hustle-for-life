import { Router } from 'express';
import { streamClaude, listSessions, resetSession } from '../lib/claude-agent.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      conversationId = 'default',
      claudeModel = 'sonnet',
    } = req.body as {
      messages: Array<{ id?: string; role: string; parts?: Array<{ type: string; text?: string }>; content?: string }>;
      conversationId?: string;
      claudeModel?: 'sonnet' | 'opus' | 'haiku';
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    // Extract last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    let messageText = '';

    if (lastUserMsg?.parts) {
      messageText = lastUserMsg.parts
        .filter(p => p.type === 'text' && p.text)
        .map(p => p.text)
        .join('\n');
    } else if (lastUserMsg?.content) {
      messageText = String(lastUserMsg.content);
    }

    if (!messageText) {
      res.status(400).json({ error: 'No user message found' });
      return;
    }

    // SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send start event
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    const startTime = Date.now();
    let firstChunk = true;

    const { abort } = streamClaude({
      conversationId,
      message: messageText,
      model: claudeModel,
      onData: (chunk) => {
        if (firstChunk) {
          console.log(`[chat] first chunk in ${Date.now() - startTime}ms`);
          res.write(`data: ${JSON.stringify({ type: 'text-start', id: conversationId })}\n\n`);
          firstChunk = false;
        }
        res.write(`data: ${JSON.stringify({ type: 'text-delta', id: conversationId, delta: chunk })}\n\n`);
        // @ts-ignore
        if (typeof res.flush === 'function') res.flush();
      },
      onDone: (fullText) => {
        isDone = true;
        console.log(`[chat] done in ${Date.now() - startTime}ms (${fullText.length} chars)`);
        res.write(`data: ${JSON.stringify({ type: 'text-end', id: conversationId })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (err) => {
        isDone = true;
        console.error(`[chat] error: ${err.slice(0, 200)}`);
        res.write(`data: ${JSON.stringify({ type: 'error', errorText: err.slice(0, 500) })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
    });

    // Note: abort() available if needed for cleanup

  } catch (err) {
    console.error('[chat] error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// List active sessions
router.get('/sessions', (_req, res) => {
  res.json({ sessions: listSessions(), count: Object.keys(listSessions()).length });
});

// Delete a session
router.delete('/sessions/:conversationId', (req, res) => {
  resetSession(req.params.conversationId);
  res.json({ deleted: req.params.conversationId });
});

export default router;
