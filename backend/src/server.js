/**
 * Hustle For Life - Backend Server
 *
 * Main server that provides:
 * - WebSocket endpoint for real-time chat with Claude Code
 * - REST API for session management and health data
 * - File listing for @file autocomplete
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { config } from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { SessionManager } from './session-manager.js';
import { HealthDataStore } from './health-data.js';

// Load environment variables
config();

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [new transports.Console()]
});

// Initialize services
const sessionManager = new SessionManager();
const healthStore = new HealthDataStore();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================
// REST API ROUTES
// ============================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * List available departments
 */
app.get('/api/departments', (req, res) => {
  const departments = sessionManager.getDepartments();
  res.json(departments);
});

/**
 * List all sessions
 */
app.get('/api/sessions', (req, res) => {
  const { department } = req.query;
  const sessions = department
    ? sessionManager.listSessionsForDepartment(department)
    : sessionManager.listSessions();
  res.json(sessions);
});

/**
 * Create a new session
 */
app.post('/api/sessions', (req, res) => {
  const { department, name } = req.body;

  if (!department) {
    return res.status(400).json({ error: 'Department is required' });
  }

  const session = sessionManager.createSession(department, name);
  res.json(session.toJSON());
});

/**
 * Get session details
 */
app.get('/api/sessions/:id', (req, res) => {
  const session = sessionManager.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session.toJSON());
});

/**
 * Archive/delete a session
 */
app.delete('/api/sessions/:id', (req, res) => {
  const success = sessionManager.archiveSession(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true });
});

/**
 * List files in a session's working directory (for @file autocomplete)
 */
app.get('/api/sessions/:id/files', (req, res) => {
  const { prefix } = req.query;
  const files = sessionManager.listFiles(req.params.id, prefix || '');
  res.json(files);
});

/**
 * Ingest health data from iOS app
 */
app.post('/api/health-data', (req, res) => {
  try {
    const result = healthStore.ingest(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Error ingesting health data: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get health data for a specific date
 */
app.get('/api/health-data/:date', (req, res) => {
  const data = healthStore.getForDate(req.params.date);
  if (!data) {
    return res.status(404).json({ error: 'No data for this date' });
  }
  res.json(data);
});

/**
 * Get health data for today
 */
app.get('/api/health-data', (req, res) => {
  const { days, start, end } = req.query;

  if (days) {
    const data = healthStore.getLastNDays(parseInt(days));
    res.json(data);
  } else if (start && end) {
    const data = healthStore.getRange(start, end);
    res.json(data);
  } else {
    const today = new Date().toISOString().split('T')[0];
    const data = healthStore.getForDate(today);
    res.json(data || { message: 'No data for today' });
  }
});

/**
 * Get health summary
 */
app.get('/api/health-data/summary/:days', (req, res) => {
  const md = healthStore.generateMarkdownSummary(parseInt(req.params.days));
  res.type('text/markdown').send(md);
});

/**
 * Log a single health metric
 */
app.post('/api/health-data/metric', (req, res) => {
  const { metric, value, date } = req.body;

  if (!metric || value === undefined) {
    return res.status(400).json({ error: 'Metric and value are required' });
  }

  const result = healthStore.logMetric(metric, value, date);
  res.json({ success: true, data: result });
});

// ============================================
// HTTP & WEBSOCKET SERVER
// ============================================

const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// Track connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let currentSession = null;

  logger.info(`WebSocket client connected: ${clientId}`);

  // Handle incoming messages
  ws.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', content: 'Invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'join':
        // Join an existing session or create a new one
        try {
          currentSession = sessionManager.getOrCreate(msg.sessionId, msg.department);

          // Set up output handler for this client
          const outputHandler = (json) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify(json));
            }
          };

          // Store handler reference for cleanup
          clients.set(clientId, { ws, session: currentSession, outputHandler });

          // Subscribe to session output
          currentSession.on('output', outputHandler);

          // Send confirmation
          ws.send(JSON.stringify({
            type: 'joined',
            sessionId: currentSession.id,
            department: currentSession.department,
            name: currentSession.name,
            isNew: !msg.sessionId
          }));

          logger.info(`Client ${clientId} joined session ${currentSession.id} (${currentSession.department})`);
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', content: err.message }));
        }
        break;

      case 'input':
        // Forward user message to Claude Code
        if (!currentSession) {
          ws.send(JSON.stringify({ type: 'error', content: 'Not joined to a session' }));
          return;
        }

        const success = currentSession.sendInput(msg.text);
        if (!success) {
          ws.send(JSON.stringify({ type: 'error', content: 'Failed to send input - session may be disconnected' }));
        }

        // Echo back the user message
        ws.send(JSON.stringify({
          type: 'user',
          content: msg.text,
          timestamp: new Date().toISOString()
        }));
        break;

      case 'abort':
        // Send interrupt signal
        if (currentSession) {
          currentSession.abort();
          ws.send(JSON.stringify({ type: 'aborted' }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', content: `Unknown message type: ${msg.type}` }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    logger.info(`WebSocket client disconnected: ${clientId}`);

    const client = clients.get(clientId);
    if (client && client.session && client.outputHandler) {
      client.session.removeListener('output', client.outputHandler);
    }
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (err) => {
    logger.error(`WebSocket error for client ${clientId}: ${err.message}`);
  });
});

// Periodic cleanup of idle sessions
setInterval(() => {
  sessionManager.cleanup(60); // Clean up sessions idle for more than 60 minutes
}, 5 * 60 * 1000); // Run every 5 minutes

// Start server
server.listen(PORT, () => {
  logger.info(`Hustle For Life backend server running on port ${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  logger.info(`REST API: http://localhost:${PORT}/api`);

  // Log discovered departments
  const departments = sessionManager.getDepartments();
  logger.info(`Available departments: ${departments.map(d => d.name).join(', ') || 'none'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');

  // Close all sessions
  for (const session of sessionManager.listSessions()) {
    sessionManager.archiveSession(session.id);
  }

  // Close WebSocket connections
  wss.close(() => {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

export default server;
