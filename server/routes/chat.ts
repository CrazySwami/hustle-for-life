import { Router } from 'express';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { claudeCode } from '../lib/claude-code.js';
import { models, type ModelId } from '../lib/gateway.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, model: modelId = 'claude-code' } = req.body as {
      messages: UIMessage[];
      model?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    let model;
    if (modelId === 'claude-code') {
      model = claudeCode('sonnet');
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
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx/proxy buffering
    res.flushHeaders(); // Send headers immediately

    if (streamResponse.body) {
      const reader = streamResponse.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
          // @ts-ignore - flush exists on Node response when not compressed
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

export default router;
