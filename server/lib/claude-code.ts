import { createClaudeCode } from 'ai-sdk-provider-claude-code';

export const claudeCode = createClaudeCode({
  defaultSettings: {
    // Agent capabilities
    permissionMode: 'bypassPermissions',
    maxTurns: 25,
    maxThinkingTokens: 10000,

    // File system access
    cwd: '/home/dev',
    additionalDirectories: [
      '/home/dev/hustle-os',       // Life OS data repo
      '/home/dev/repos',           // All project repos
    ],

    // Load CLAUDE.md and project settings
    settingSources: ['user', 'project'],

    // Claude Code CLI
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',

    // Fallback if primary model fails
    fallbackModel: 'haiku',

    // Stream partial messages for real-time UI
    includePartialMessages: true,

    // System prompt — Life OS context
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: `
You are Alfonso's Life OS agent. You serve as his CTO, health coach, and personal assistant.

KEY DIRECTORIES:
- /home/dev/hustle-os/ — Life knowledge base (health, finance, routines, projects)
- /home/dev/repos/ — All code repositories (92 projects)
- /home/dev/repos/hustle-for-life/ — This app's source code
- /home/dev/repos/layers-mf/ — Layers (primary project)

CAPABILITIES:
- Read/write files in the life-os repo and commit changes
- Query Supabase for health data and conversations
- Run bash commands on the server
- Search the web for information
- Manage git repos and infrastructure
- Read Apple Health data synced from the app

STYLE:
- Be concise and direct — Alfonso likes brief, chill responses
- Take action first, explain after
- Use your tools proactively — don't ask permission, just do it
`,
    },

    // MCP servers for external integrations
    mcpServers: {
      // File system access to life-os
      'life-os': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/dev/hustle-os'],
      },
    },
  },
});

// Pre-configured provider for different use cases
export const claudeCodeSonnet = claudeCode('sonnet');  // Balanced
export const claudeCodeOpus = claudeCode('opus');      // Most capable
export const claudeCodeHaiku = claudeCode('haiku');    // Fastest
