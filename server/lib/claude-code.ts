import { createClaudeCode } from 'ai-sdk-provider-claude-code';

// =============================================================================
// SAFETY ARCHITECTURE — Tiered Access
// =============================================================================
//
// DEFAULT (no toggle):
//   ✅ /home/dev/hustle-os/           — Life data (read + write)
//   ✅ /home/dev/repos/hustle-for-life/ — This app (read + write)
//   ❌ Everything else                 — No access
//
// WITH "dev-mode" toggle from app:
//   ✅ /home/dev/repos/*              — All repos (read + write)
//   ✅ /home/dev/hustle-os/           — Life data (read + write)
//   ⚠️  Full developer access
//
// Running service at /home/dev/services/life-api/ is ALWAYS protected.
// =============================================================================

// Access scopes — agent gets different access based on toggle
interface AccessScope {
  cwd: string;
  additionalDirectories: string[];
  systemPromptExtra: string;
}

const SCOPES: Record<string, AccessScope> = {
  // Default: only life-os + this app
  default: {
    cwd: '/home/dev/repos/hustle-for-life',
    additionalDirectories: [
      '/home/dev/hustle-os',
    ],
    systemPromptExtra: `
ACCESS SCOPE: STANDARD
You can ONLY access these directories:
- /home/dev/hustle-os/ — Life data (read + write)
- /home/dev/repos/hustle-for-life/ — This app's code (read + write)

You CANNOT see or access any other repos or directories.
If asked about other projects, say you don't have access and suggest enabling Dev Mode in settings.
`,
  },

  // Dev mode: full repo access
  'dev-mode': {
    cwd: '/home/dev/repos/hustle-for-life',
    additionalDirectories: [
      '/home/dev/hustle-os',
      '/home/dev/repos',
    ],
    systemPromptExtra: `
ACCESS SCOPE: DEV MODE (full access)
You have read/write access to:
- /home/dev/hustle-os/ — Life data
- /home/dev/repos/hustle-for-life/ — This app's code
- /home/dev/repos/* — All 92 project repos (Layers, AI Brand Studio, clients, etc.)

You can read, edit, and commit changes across any repo. Be careful with client projects.
`,
  },
};

// Shared disallowed tools (always blocked regardless of scope)
const DISALLOWED_TOOLS = [
  'Bash(rm -rf:*)',
  'Bash(rm -r:*)',
  'Bash(systemctl stop:*)',
  'Bash(systemctl disable:*)',
  'Bash(kill:*)',
  'Bash(pkill:*)',
  'Bash(git push origin:*)',
  'Bash(git reset --hard:*)',
  'Bash(git clean:*)',
  'Bash(sudo:*)',
  'Bash(cat */.env:*)',
  'Write(/home/dev/services/*:*)',
  'Edit(/home/dev/services/*:*)',
  'Read(/home/dev/services/*:*)',
];

// Base system prompt (shared across all scopes)
const BASE_SYSTEM_PROMPT = `
You are Alfonso's Life OS agent — his CTO, health coach, and personal assistant.

ARCHITECTURE:
- You work on the REPO at /home/dev/repos/hustle-for-life/ (your codebase)
- The RUNNING SERVICE is at /home/dev/services/life-api/ (separate, isolated)
- Editing repo code does NOT affect the running service
- To deploy changes: run /home/dev/repos/hustle-for-life/deploy.sh

WHAT YOU CAN DO:
- Read/write/edit files in hustle-os (life data management)
- Read/write/edit files in hustle-for-life repo (improve the app!)
- Git commit your changes and push to gitea
- Run deploy.sh when changes are tested and ready
- Run safe bash (ls, cat, grep, git, curl, node, npm)
- Search the web for information

WHAT YOU CANNOT DO (EVER):
- Modify /home/dev/services/life-api/ (running service)
- Run destructive commands (rm -rf, kill, systemctl stop)
- Read .env files or API keys
- Push to GitHub origin

STYLE:
- Be concise and direct — Alfonso likes brief, chill responses
- Take action first, explain after
`;

/**
 * Create a Claude Code provider with the given access scope.
 * Called per-request so the scope can change based on the toggle.
 */
export function createScopedProvider(scope: string = 'default') {
  const access = SCOPES[scope] || SCOPES.default;

  return createClaudeCode({
    defaultSettings: {
      permissionMode: 'bypassPermissions',
      maxTurns: 25,
      maxThinkingTokens: 10000,

      cwd: access.cwd,
      additionalDirectories: access.additionalDirectories,

      settingSources: ['project'],
      pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',

      disallowedTools: DISALLOWED_TOOLS,

      fallbackModel: 'haiku',
      includePartialMessages: true,

      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append: BASE_SYSTEM_PROMPT + access.systemPromptExtra,
      },

      mcpServers: {
        'life-os': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/dev/hustle-os'],
        },
      },
    },
  });
}

// Default provider (backwards compatible)
export const claudeCode = createScopedProvider('default');
