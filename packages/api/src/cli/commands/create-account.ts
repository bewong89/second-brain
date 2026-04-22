/**
 * Create Account Command
 *
 * Creates a new account via the API.
 */
import { getApiUrl, getAdminApiKey } from '../shared/api-client.js';

interface CreateAccountResponse {
  accountId: string;
  isAdmin: boolean;
  name: string;
  email?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function createAccount(name: string): Promise<void> {
  const apiUrl = getApiUrl();
  const adminKey = await getAdminApiKey();

  console.log(`Creating account: ${name}`);

  const response = await fetch(`${apiUrl}/admin/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': adminKey,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create account: ${response.status} ${error}`);
  }

  const result: CreateAccountResponse = (await response.json()) as CreateAccountResponse;

  console.log('\nAccount created successfully!');
  console.log(`  Account ID: ${result.accountId}`);
  console.log(`  Name: ${result.name}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Admin: ${result.isAdmin}`);
  console.log(`  Created: ${result.createdAt}`);
}