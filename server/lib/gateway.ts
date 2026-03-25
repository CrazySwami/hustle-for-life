import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export const models = {
  'claude-code': null, // handled separately via claude-code provider
  'claude-sonnet': () => anthropic('claude-sonnet-4-6'),
  'gpt-5.3': () => openai('gpt-5.3'),
  'gemini-3.1': () => google('gemini-3.1'),
} as const;

export type ModelId = keyof typeof models;

export function getModelList() {
  return [
    { id: 'claude-code', name: 'Claude Code (Full Agent)', provider: 'anthropic', primary: true },
    { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', provider: 'anthropic' },
    { id: 'gpt-5.3', name: 'GPT 5.3', provider: 'openai' },
    { id: 'gemini-3.1', name: 'Gemini 3.1', provider: 'google' },
  ];
}
