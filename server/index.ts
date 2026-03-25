import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './lib/auth.js';
import chatRouter from './routes/chat.js';
import { getModelList } from './lib/gateway.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3500');

app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Model list (no auth)
app.get('/api/models', (_req, res) => {
  res.json({ models: getModelList() });
});

// Protected routes
app.use('/api', authMiddleware);
app.use('/api', chatRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`);
  console.log(`[server] Tailscale: http://100.99.131.90:${PORT}`);
});
