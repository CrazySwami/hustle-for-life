import { Router } from 'express';
import { streamText } from 'ai';
import { claudeCode } from '../lib/claude-code.js';
import { models, type ModelId } from '../lib/gateway.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, model: modelId = 'claude-code' } = req.body;

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

    const result = streamText({
      model,
      messages,
    });

    // Set headers for Expo streaming
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Encoding', 'none');

    // Pipe the AI SDK stream to the response
    result.pipeDataStreamToResponse(res);
  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
