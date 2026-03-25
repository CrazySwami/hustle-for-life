const API_BASE = 'http://100.99.131.90:3500';

export function generateAPIUrl(path: string): string {
  return API_BASE + path;
}

// Dev key — move to SecureStore for production
export const API_KEY = 'hustle-life-dev-key-2026';
