/**
 * Session Manager for Claude Code CLI processes
 *
 * Handles spawning, managing, and communicating with Claude Code CLI instances.
 * Each session corresponds to a "department" with its own working directory and CLAUDE.md.
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [new transports.Console()]
});

// Root directory for all departments
const HUSTLE_ROOT = process.env.HUSTLE_ROOT || '/home/alfonso/hustle';

/**
 * Represents a single Claude Code CLI session
 */
export class Session extends EventEmitter {
  constructor(id, department, name = null) {
    super();
    this.id = id;
    this.department = department;
    this.name = name || `${department} - ${new Date().toISOString().split('T')[0]}`;
    this.cwd = path.join(HUSTLE_ROOT, department);
    this.process = null;
    this.buffer = '';
    this.isActive = false;
    this.createdAt = new Date();
    this.lastActivityAt = new Date();
    this.messageCount = 0;
  }

  /**
   * Initialize the session (just sets up the directory, doesn't spawn yet)
   */
  start() {
    // Ensure the working directory exists
    if (!fs.existsSync(this.cwd)) {
      fs.mkdirSync(this.cwd, { recursive: true });
      logger.info(`Created directory for department: ${this.cwd}`);
    }

    logger.info(`Session ${this.id} initialized for department ${this.department}`);
    this.isActive = true;
  }

  /**
   * Spawn a Claude process for a specific prompt
   * Each message spawns a new process, using --resume for continuity
   */
  spawnForPrompt(prompt) {
    // Kill any existing process
    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    logger.info(`Spawning Claude for session ${this.id} with prompt: ${prompt.substring(0, 50)}...`);

    // Build arguments
    const args = [
      '--print', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions'
    ];

    // Resume from previous conversation if we have messages
    if (this.messageCount > 0) {
      args.push('--resume', this.id);
    }

    // Spawn Claude Code CLI
    this.process = spawn('claude', args, {
      cwd: this.cwd,
      env: {
        ...process.env,
        TERM: 'dumb',
        NO_COLOR: '1'
      }
    });

    // Parse newline-delimited JSON from stdout
    this.process.stdout.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      logger.info(`Session ${this.id} received ${chunkStr.length} bytes of stdout`);
      console.log('RAW STDOUT:', chunkStr.substring(0, 200));
      this.buffer += chunkStr;
      this.processBuffer();
    });

    this.process.stderr.on('data', (chunk) => {
      const content = chunk.toString();
      logger.info(`Session ${this.id} stderr: ${content}`);
      console.log('RAW STDERR:', content);
      // Only emit as error if it's not just informational
      if (content.toLowerCase().includes('error')) {
        this.emit('output', { type: 'error', content });
      }
    });

    this.process.on('exit', (code, signal) => {
      logger.info(`Session ${this.id} process exited with code ${code}, signal ${signal}`);
      this.process = null;
      // Send result message when process completes
      this.emit('output', { type: 'result', session_id: this.id });
    });

    this.process.on('error', (err) => {
      logger.error(`Session ${this.id} process error: ${err.message}`);
      this.process = null;
      this.emit('output', { type: 'error', content: err.message });
    });
  }

  /**
   * Process the buffer and emit complete JSON lines
   */
  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          this.lastActivityAt = new Date();
          this.emit('output', json);
        } catch (e) {
          // Non-JSON output, emit as raw
          logger.debug(`Non-JSON output from session ${this.id}: ${line}`);
          this.emit('output', { type: 'raw', content: line });
        }
      }
    }
  }

  /**
   * Send input to Claude - spawns a new process for each message
   */
  sendInput(text) {
    if (!text || !text.trim()) {
      logger.warn(`Cannot send empty input to session ${this.id}`);
      return false;
    }

    this.lastActivityAt = new Date();

    // Spawn a new Claude process with this prompt
    this.spawnForPrompt(text);

    this.messageCount++;
    logger.info(`Sent input to session ${this.id}: ${text.substring(0, 50)}...`);
    return true;
  }

  /**
   * Send abort signal (Ctrl+C equivalent)
   */
  abort() {
    if (this.process) {
      this.process.kill('SIGINT');
      logger.info(`Sent SIGINT to session ${this.id}`);
    }
  }

  /**
   * Resume an existing session - just marks as active
   * Actual resumption happens when sendInput is called with --resume flag
   */
  resume() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    logger.info(`Resuming session ${this.id}`);
    this.isActive = true;
    // Next sendInput will use --resume flag since messageCount > 0
  }

  /**
   * Kill the session process
   */
  kill() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.isActive = false;
      logger.info(`Killed session ${this.id}`);
    }
  }

  /**
   * Get session metadata
   */
  toJSON() {
    return {
      id: this.id,
      department: this.department,
      name: this.name,
      cwd: this.cwd,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      lastActivityAt: this.lastActivityAt.toISOString(),
      messageCount: this.messageCount
    };
  }
}

/**
 * Manages all Claude Code sessions
 */
export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.departments = this.discoverDepartments();
  }

  /**
   * Discover available departments from the file system
   */
  discoverDepartments() {
    const departments = [];

    if (!fs.existsSync(HUSTLE_ROOT)) {
      fs.mkdirSync(HUSTLE_ROOT, { recursive: true });
      logger.info(`Created hustle root directory: ${HUSTLE_ROOT}`);
    }

    try {
      const entries = fs.readdirSync(HUSTLE_ROOT, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const claudeMdPath = path.join(HUSTLE_ROOT, entry.name, 'CLAUDE.md');
          departments.push({
            name: entry.name,
            path: path.join(HUSTLE_ROOT, entry.name),
            hasClaudeMd: fs.existsSync(claudeMdPath)
          });
        }
      }
    } catch (err) {
      logger.error(`Error discovering departments: ${err.message}`);
    }

    logger.info(`Discovered ${departments.length} departments: ${departments.map(d => d.name).join(', ')}`);
    return departments;
  }

  /**
   * Get or create a session
   */
  getOrCreate(sessionId, department) {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);

      // Resume if not active
      if (!session.isActive) {
        session.resume();
      }

      return session;
    }

    const id = sessionId || uuidv4();
    const session = new Session(id, department);
    session.start();
    this.sessions.set(id, session);

    return session;
  }

  /**
   * Get a session by ID
   */
  get(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Create a new session for a department
   */
  createSession(department, name = null) {
    const id = uuidv4();
    const session = new Session(id, department, name);
    session.start();
    this.sessions.set(id, session);
    return session;
  }

  /**
   * List all sessions
   */
  listSessions() {
    return Array.from(this.sessions.values()).map(s => s.toJSON());
  }

  /**
   * List sessions for a specific department
   */
  listSessionsForDepartment(department) {
    return Array.from(this.sessions.values())
      .filter(s => s.department === department)
      .map(s => s.toJSON());
  }

  /**
   * Archive/remove a session
   */
  archiveSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill();
      this.sessions.delete(sessionId);
      logger.info(`Archived session ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * List files in a session's working directory (for @file autocomplete)
   */
  listFiles(sessionId, prefix = '') {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const dir = session.cwd;
    const files = [];

    const walk = (d, depth = 0) => {
      if (depth > 3) return; // Limit depth for performance

      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          // Skip hidden files and common non-relevant directories
          if (entry.name.startsWith('.') ||
              entry.name === 'node_modules' ||
              entry.name === '__pycache__') {
            continue;
          }

          const full = path.join(d, entry.name);
          const rel = path.relative(dir, full);

          if (entry.isDirectory()) {
            walk(full, depth + 1);
          } else if (!prefix || rel.toLowerCase().includes(prefix.toLowerCase())) {
            files.push(rel);
          }
        }
      } catch (err) {
        logger.debug(`Error walking directory ${d}: ${err.message}`);
      }
    };

    walk(dir);
    return files.slice(0, 50); // Limit results
  }

  /**
   * Get list of available departments
   */
  getDepartments() {
    // Re-discover in case new ones were added
    this.departments = this.discoverDepartments();
    return this.departments;
  }

  /**
   * Cleanup inactive sessions
   */
  cleanup(maxIdleMinutes = 60) {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      const idleMinutes = (now - session.lastActivityAt) / (1000 * 60);
      if (idleMinutes > maxIdleMinutes) {
        session.kill();
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} idle sessions`);
    }

    return cleaned;
  }
}

export default SessionManager;
