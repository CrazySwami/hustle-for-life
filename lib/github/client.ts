import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://api.github.com';
const OWNER = 'CrazySwami';
const REPO = 'life-os';
const TOKEN_KEY = 'github_token';

interface GitHubFileResponse {
  readonly name: string;
  readonly path: string;
  readonly sha: string;
  readonly size: number;
  readonly content: string;
  readonly encoding: string;
}

interface GitHubDirectoryEntry {
  readonly name: string;
  readonly path: string;
  readonly sha: string;
  readonly size: number;
  readonly type: 'file' | 'dir';
}

interface GitHubCreateUpdateResponse {
  readonly content: {
    readonly name: string;
    readonly path: string;
    readonly sha: string;
  };
  readonly commit: {
    readonly sha: string;
    readonly message: string;
  };
}

export interface GitHubFile {
  readonly content: string;
  readonly sha: string;
  readonly path: string;
}

export interface GitHubError {
  readonly status: number;
  readonly message: string;
}

const getToken = async (): Promise<string> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    throw new Error('GitHub token not found. Please add your token in Settings.');
  }
  return token;
};

const repoUrl = (path: string): string =>
  `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;

const headers = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

const decodeBase64 = (encoded: string): string => {
  const cleaned = encoded.replace(/\n/g, '');
  return globalThis.atob(cleaned);
};

const encodeBase64 = (content: string): string =>
  globalThis.btoa(content);

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.text().catch(() => 'Unknown error');
    const error: GitHubError = {
      status: response.status,
      message: `GitHub API error ${response.status}: ${body}`,
    };
    throw error;
  }
  return response.json() as Promise<T>;
};

export const getFile = async (path: string): Promise<GitHubFile | null> => {
  try {
    const token = await getToken();
    const response = await fetch(repoUrl(path), { headers: headers(token) });

    if (response.status === 404) return null;

    const data = await handleResponse<GitHubFileResponse>(response);
    return {
      content: decodeBase64(data.content),
      sha: data.sha,
      path: data.path,
    };
  } catch (error) {
    if ((error as GitHubError).status === 404) return null;
    throw error;
  }
};

export const createOrUpdateFile = async (
  path: string,
  content: string,
  message: string,
): Promise<GitHubCreateUpdateResponse> => {
  const token = await getToken();

  const existing = await getFile(path);

  const body: Record<string, string> = {
    message,
    content: encodeBase64(content),
  };

  if (existing) {
    body.sha = existing.sha;
  }

  const response = await fetch(repoUrl(path), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  });

  return handleResponse<GitHubCreateUpdateResponse>(response);
};

export const listDirectory = async (path: string): Promise<readonly GitHubDirectoryEntry[]> => {
  try {
    const token = await getToken();
    const response = await fetch(repoUrl(path), { headers: headers(token) });

    if (response.status === 404) return [];

    return handleResponse<GitHubDirectoryEntry[]>(response);
  } catch {
    return [];
  }
};
