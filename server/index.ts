import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './lib/auth.js';
import chatRouter from './routes/chat.js';
import { getModelList } from './lib/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3500');

app.use(cors());
app.use(express.json());

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Model list (no auth)
app.get('/api/models', (_req, res) => {
  res.json({ models: getModelList() });
});

// Available access scopes (no auth — just metadata)
app.get('/api/scopes', (_req, res) => {
  res.json({
    scopes: [
      {
        id: 'default',
        name: 'Standard',
        description: 'Life data + this app only',
        access: ['hustle-os (read/write)', 'hustle-for-life (read/write)'],
        icon: '🔒',
      },
      {
        id: 'dev-mode',
        name: 'Dev Mode',
        description: 'Full access to all 92 repos',
        access: ['hustle-os (read/write)', 'hustle-for-life (read/write)', 'All repos (read/write)'],
        icon: '🔓',
        warning: 'Agent can see and edit all project code',
      },
    ],
  });
});

// Protected routes
app.use('/api', authMiddleware);
app.use('/api', chatRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`);
  console.log(`[server] Tailscale: http://100.99.131.90:${PORT}`);
});
