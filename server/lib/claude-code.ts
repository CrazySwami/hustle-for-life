import { createClaudeCode } from 'ai-sdk-provider-claude-code';

// =============================================================================
// SAFETY ARCHITECTURE — Staging Worktree Pattern
// =============================================================================
//
// THREE ENVIRONMENTS:
//
//   LIVE SERVICE:    /home/dev/services/life-api/        (always protected)
//   PRODUCTION REPO: /home/dev/repos/hustle-for-life/    (branch: expo-react-native)
//   STAGING REPO:    /home/dev/repos/hustle-for-life-staging/ (branch: staging)
//
// The agent ALWAYS edits the STAGING worktree. Never production directly.
// Staging has its own server on port 3501 for testing.
//
// Workflow: Agent edits staging → tests on :3501 → promote.sh merges to prod
//
// =============================================================================

// Access scopes — agent gets different access based on toggle
interface AccessScope {
  cwd: string;
  additionalDirectories: string[];
  systemPromptExtra: string;
}

const SCOPES: Record<string, AccessScope> = {
  // Default: life-os + staging worktree (safe sandbox)
  default: {
    cwd: '/home/dev/repos/hustle-for-life-staging',
    additionalDirectories: [
      '/home/dev/hustle-os',
    ],
    systemPromptExtra: `
ACCESS SCOPE: STANDARD
You work in the STAGING worktree: /home/dev/repos/hustle-for-life-staging/
- This is a safe sandbox — your edits don't affect the live app
- Staging server runs on port 3501 for testing
- Life data: /home/dev/hustle-os/ (read + write)

WORKFLOW:
1. Edit code in /home/dev/repos/hustle-for-life-staging/
2. Test at http://localhost:3501 (staging server auto-restarts)
3. When it works, run: bash /home/dev/repos/hustle-for-life/promote.sh
4. This merges staging → production and deploys

You CANNOT see other repos. Suggest enabling Dev Mode for that.
`,
  },

  // Dev mode: staging + all repos
  'dev-mode': {
    cwd: '/home/dev/repos/hustle-for-life-staging',
    additionalDirectories: [
      '/home/dev/hustle-os',
      '/home/dev/repos',
    ],
    systemPromptExtra: `
ACCESS SCOPE: DEV MODE (full access)
You work in the STAGING worktree: /home/dev/repos/hustle-for-life-staging/
- Staging server runs on port 3501 for testing
- Life data: /home/dev/hustle-os/ (read + write)
- All 92 repos: /home/dev/repos/* (read + write)

WORKFLOW: Same as standard — edit staging, test, promote when ready.
You can also read/edit other repos (Layers, clients, etc.) — be careful.
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

ARCHITECTURE (3 environments):
- STAGING:    /home/dev/repos/hustle-for-life-staging/ (YOU EDIT HERE — safe sandbox)
- PRODUCTION: /home/dev/repos/hustle-for-life/ (merged from staging)
- LIVE:       /home/dev/services/life-api/ (deployed, isolated, NEVER touch)

Your edits go to STAGING. The live app is unaffected until promoted.
- Staging server: http://localhost:3501 (auto-restarts on file changes)
- Live server:    http://localhost:3500 (only updates via promote.sh)

WORKFLOW:
1. Edit files in staging worktree
2. Test your changes at localhost:3501
3. Git commit on staging branch
4. Run promote.sh to merge staging → production → deploy to live

WHAT YOU CAN DO:
- Read/write files in staging worktree (improve the app!)
- Read/write files in hustle-os (life data)
- Git commit and push to gitea
- Run safe bash (ls, cat, grep, git, curl, node, npm, npx)
- Search the web
- Test changes on the staging server

WHAT YOU CANNOT DO (EVER):
- Write to /home/dev/services/ (live service)
- Write directly to /home/dev/repos/hustle-for-life/ (production — use promote.sh)
- Run destructive commands (rm -rf, kill, systemctl stop)
- Read .env files or API keys

STYLE:
- Be concise and direct — Alfonso likes brief, chill responses
- Take action first, explain after
- When improving the app: edit staging, test, tell Alfonso what you changed
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
      maxTurns: 10,
      maxThinkingTokens: 2000,

      cwd: access.cwd,
      additionalDirectories: access.additionalDirectories,

      // Skip hooks, LSP, plugin sync, auto-memory for faster spawns
      settingSources: [],
      pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',

      disallowedTools: DISALLOWED_TOOLS,

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
