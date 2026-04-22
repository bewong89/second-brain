/**
 * Create API Key Command
 *
 * Creates an API key for an account via the API.
 */
import { getApiUrl, getAdminApiKey } from '../shared/api-client.js';

interface CreateApiKeyResponse {
  keyId: string;
  accountId: string;
  apiKey: string;
  status: string;
  createdAt: string;
}

export async function createApiKey(accountId: string): Promise<void> {
  const apiUrl = getApiUrl();
  const adminKey = await getAdminApiKey();

  console.log(`Creating API key for account: ${accountId}`);

  const response = await fetch(`${apiUrl}/admin/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': adminKey,
    },
    body: JSON.stringify({ accountId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create API key: ${response.status} ${error}`);
  }

  const result: CreateApiKeyResponse = (await response.json()) as CreateApiKeyResponse;

  console.log('\nAPI key created successfully!');
  console.log(`  Key ID: ${result.keyId}`);
  console.log(`  Account ID: ${result.accountId}`);
  console.log(`  API Key: ${result.apiKey}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Created: ${result.createdAt}`);
  console.log('\n⚠️  IMPORTANT: Save this API key now. It will not be shown again.');
}