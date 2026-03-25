import { createClaudeCode } from 'ai-sdk-provider-claude-code';

export const claudeCode = createClaudeCode({
  defaultSettings: {
    permissionMode: 'bypassPermissions',
    cwd: '/home/dev',
    maxTurns: 15,
    systemPrompt: `You are Alfonso's Life OS assistant. You have access to his full life knowledge base at /home/dev/hustle-os/ and can read health data, query Supabase, and manage his life domains. Be concise and helpful.`,
    settingSources: ['project'],
    pathToClaudeCodeExecutable: '/home/dev/.local/bin/claude',
  },
});
