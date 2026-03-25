const API_BASE = 'https://life.hustletogether.com';

export function generateAPIUrl(path: string): string {
  return API_BASE + path;
}

// Dev key — move to SecureStore for production
export const API_KEY = 'hustle-life-dev-key-2026';
