import { createClaudeCode } from 'ai-sdk-provider-claude-code';

// =============================================================================
// SAFETY ARCHITECTURE
// =============================================================================
//
// The agent from the app has RESTRICTED access. It can:
//   ✅ Read/write /home/dev/hustle-os/ (life data — this is the whole point)
//   ✅ Read any repo in /home/dev/repos/ (for context, analysis)
//   ✅ Run safe bash commands (ls, cat, git log, curl, etc.)
//   ✅ Search the web
//   ✅ Query Supabase via MCP
//
// It CANNOT:
//   ❌ Write to /home/dev/repos/hustle-for-life/server/ (its own code)
//   ❌ Run destructive commands (rm -rf, systemctl stop, kill, etc.)
//   ❌ Modify systemd services
//   ❌ Push to GitHub origin (only gitea auto-backup)
//   ❌ Access credentials or .env files
//
// The system prompt enforces boundaries. The disallowedTools + cwd further
// restrict what's possible. For full dev access, use the Claude Code CLI
// directly — not the app.
// =============================================================================

export const claudeCode = createClaudeCode({
  defaultSettings: {
    // Permissions: bypass for tool execution, but scoped by system prompt + disallowed tools
    permissionMode: 'bypassPermissions',
    maxTurns: 25,
    maxThinkingTokens: 10000,

    // Working directory: life-os data repo (NOT the app code)
    cwd: '/home/dev/hustle-os',

    // Can read these additional dirs but writes are governed by system prompt
    additionalDirectories: [
      '/home/dev/repos',
    ],

    // Only load project-level settings (not user-level — avoids inheriting dev permissions)
    settingSources: ['project'],

    // Claude Code CLI
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',

    // Block dangerous tool patterns
    disallowedTools: [
      'Bash(rm -rf:*)',            // No recursive deletes
      'Bash(rm -r:*)',             // No recursive deletes
      'Bash(systemctl stop:*)',    // No stopping services
      'Bash(systemctl disable:*)', // No disabling services
      'Bash(kill:*)',              // No killing processes
      'Bash(pkill:*)',             // No killing processes
      'Bash(git push origin:*)',   // No pushing to GitHub
      'Bash(git reset --hard:*)',  // No destructive git
      'Bash(git clean:*)',         // No destructive git
      'Bash(chmod:*)',             // No permission changes
      'Bash(chown:*)',             // No ownership changes
      'Bash(sudo:*)',              // No privilege escalation
      'Bash(cat /home/dev/repos/hustle-for-life/server/.env:*)', // No reading API keys
    ],

    // Fallback if primary model fails
    fallbackModel: 'haiku',

    // Stream partial messages for real-time UI
    includePartialMessages: true,

    // System prompt — scoped Life OS agent
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: `
You are Alfonso's Life OS agent — his personal assistant for health, life management, and information.

YOUR WORKING DIRECTORY: /home/dev/hustle-os/ (the life-os data repo)
This is where you read and write life data: health, finance, routines, learning, projects.

SAFE ACTIONS (do freely):
- Read/write/edit any file in /home/dev/hustle-os/
- Git commit and push to gitea in hustle-os (data backups)
- Read files in /home/dev/repos/ for context (code review, status checks)
- Run safe bash: ls, cat, grep, git log, git status, curl, node scripts
- Search the web for information
- Query health data and provide analysis

RESTRICTED ACTIONS (never do these):
- NEVER modify files in /home/dev/repos/hustle-for-life/server/ (your own backend code)
- NEVER modify systemd services, kill processes, or restart services
- NEVER push to GitHub origin (gitea auto-backup handles this)
- NEVER read or display .env files or API keys
- NEVER run rm -rf, git reset --hard, or other destructive commands
- If asked to do something restricted, explain why and suggest the user do it via the CLI

STYLE:
- Be concise and direct — Alfonso likes brief, chill responses
- Take action on safe operations, explain what you did
- For anything risky, explain what you'd do and let him decide
`,
    },

    // MCP servers for external integrations
    mcpServers: {
      // File system access scoped to life-os only
      'life-os': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/dev/hustle-os'],
      },
    },
  },
});

// Pre-configured provider for different use cases
export const claudeCodeSonnet = claudeCode('sonnet');  // Balanced (default)
export const claudeCodeOpus = claudeCode('opus');      // Most capable
export const claudeCodeHaiku = claudeCode('haiku');    // Fastest
