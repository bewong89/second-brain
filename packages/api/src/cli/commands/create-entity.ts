/**
 * Create Entity Command
 *
 * Creates a new entity folder via the API.
 */
import { getApiUrl, getAdminApiKey } from '../shared/api-client.js';

interface CreateEntityResponse {
  entityId: string;
  accountId: string;
  name: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
}

export async function createEntity(accountId: string, entityName: string): Promise<void> {
  const apiUrl = getApiUrl();
  const adminKey = await getAdminApiKey();

  console.log(`Creating entity "${entityName}" for account: ${accountId}`);

  const response = await fetch(`${apiUrl}/admin/entities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': adminKey,
    },
    body: JSON.stringify({ accountId, name: entityName }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create entity: ${response.status} ${error}`);
  }

  const result: CreateEntityResponse = (await response.json()) as CreateEntityResponse;

  console.log('\nEntity created successfully!');
  console.log(`  Entity ID: ${result.entityId}`);
  console.log(`  Account ID: ${result.accountId}`);
  console.log(`  Name: ${result.name}`);
  console.log(`  Type: ${result.entityType}`);
  console.log(`  Created: ${result.createdAt}`);
}