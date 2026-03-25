import { createClaudeCode } from 'ai-sdk-provider-claude-code';

// =============================================================================
// SAFETY ARCHITECTURE — "Dev Repo + Deployed Service" Pattern
// =============================================================================
//
// The running service lives at:    /home/dev/services/life-api/
// The agent edits code at:          /home/dev/repos/hustle-for-life/
//
// These are SEPARATE. The agent can freely edit the repo (including server/,
// app/, components/ — everything). The running service is unaffected until
// deploy.sh is run to copy changes over and restart.
//
// The agent CAN:
//   ✅ Read/write /home/dev/hustle-os/ (life data)
//   ✅ Read/write /home/dev/repos/hustle-for-life/ (app + server code)
//   ✅ Git commit, create branches, push to gitea
//   ✅ Run safe bash commands
//   ✅ Search the web
//   ✅ Run deploy.sh to push changes live (after testing)
//
// The agent CANNOT:
//   ❌ Directly modify /home/dev/services/life-api/ (running service)
//   ❌ Run destructive system commands (rm -rf, kill, etc.)
//   ❌ Read .env files with API keys
//   ❌ Push to GitHub origin
//
// =============================================================================

export const claudeCode = createClaudeCode({
  defaultSettings: {
    // Permissions: bypass for tool execution, but scoped by system prompt + disallowed tools
    permissionMode: 'bypassPermissions',
    maxTurns: 25,
    maxThinkingTokens: 10000,

    // Working directory: the app repo (agent can edit everything here)
    cwd: '/home/dev/repos/hustle-for-life',

    // Additional directories the agent can access
    additionalDirectories: [
      '/home/dev/hustle-os',       // Life OS data repo
      '/home/dev/repos',           // All project repos (read context)
    ],

    // Load project-level settings
    settingSources: ['project'],

    // Claude Code CLI
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',

    // Block dangerous patterns — agent can edit code but not break infrastructure
    disallowedTools: [
      'Bash(rm -rf:*)',             // No recursive deletes
      'Bash(rm -r:*)',              // No recursive deletes
      'Bash(systemctl stop:*)',     // No stopping services
      'Bash(systemctl disable:*)',  // No disabling services
      'Bash(kill:*)',               // No killing processes
      'Bash(pkill:*)',              // No killing processes
      'Bash(git push origin:*)',    // No pushing to GitHub (gitea only)
      'Bash(git reset --hard:*)',   // No destructive git
      'Bash(git clean:*)',          // No destructive git
      'Bash(sudo:*)',               // No privilege escalation
      'Bash(cat */.env:*)',         // No reading env files
      'Bash(cat */services/:*)',    // No reading deployed service
      'Write(/home/dev/services/*:*)',  // No direct writes to running service
      'Edit(/home/dev/services/*:*)',   // No direct edits to running service
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
You are Alfonso's Life OS agent — his CTO, health coach, and personal assistant.

ARCHITECTURE:
- You work on the REPO at /home/dev/repos/hustle-for-life/ (your codebase)
- The RUNNING SERVICE is at /home/dev/services/life-api/ (separate, isolated)
- Editing repo code does NOT affect the running service
- To deploy changes: run /home/dev/repos/hustle-for-life/deploy.sh

KEY DIRECTORIES:
- /home/dev/hustle-os/ — Life data repo (health, finance, routines)
- /home/dev/repos/hustle-for-life/ — This app's source code (you can edit this!)
- /home/dev/repos/ — All 92 project repos

WHAT YOU CAN DO:
- Read/write/edit files in hustle-os (life data management)
- Read/write/edit files in hustle-for-life repo (improve the app!)
- Add features, fix bugs, create components, update styles
- Git commit your changes and push to gitea
- Run deploy.sh when changes are tested and ready to go live
- Run safe bash (ls, cat, grep, git, curl, node, npm)
- Search the web for information and docs

WHAT YOU CANNOT DO:
- Directly modify /home/dev/services/life-api/ (the running service)
- Run destructive commands (rm -rf, kill, systemctl stop)
- Read .env files or API keys
- Push to GitHub origin

WORKFLOW FOR IMPROVING THE APP:
1. Edit files in /home/dev/repos/hustle-for-life/
2. Test changes (npm run, npx expo, etc.)
3. Git commit with a clear message
4. Run deploy.sh to push server changes live
5. App changes go live on next git pull + expo start from Alfonso's device

STYLE:
- Be concise and direct — Alfonso likes brief, chill responses
- Take action first, explain after
- For app improvements, make the change, commit, and tell him what you did
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
