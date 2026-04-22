/**
 * Shared API Client
 *
 * Provides common functions for making API requests.
 */
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Get API URL from environment or config
 */
export function getApiUrl(): string {
  return process.env.API_URL || 'https://api.secondbrain.io';
}

/**
 * Get admin API key from environment or config file
 */
export async function getAdminApiKey(): Promise<string> {
  // Check environment variable first
  const envKey = process.env.SECOND_BRAIN_ADMIN_KEY;
  if (envKey) {
    return envKey;
  }

  // Check config file
  const configPath = join(homedir(), '.second-brain', 'admin.key');
  try {
    const key = (await readFile(configPath, 'utf-8')).trim();
    if (key) {
      return key;
    }
  } catch {
    // Config file doesn't exist, continue to error
  }

  throw new Error(
    'Admin API key not found. Set SECOND_BRAIN_ADMIN_KEY environment variable or create ~/.second-brain/admin.key'
  );
}

/**
 * Make an authenticated API request
 */
export async function makeApiRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown
): Promise<T> {
  const apiUrl = getApiUrl();
  const adminKey = await getAdminApiKey();

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': adminKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} ${error}`);
  }

  return response.json() as Promise<T>;
}