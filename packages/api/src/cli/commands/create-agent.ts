/**
 * Create Agent Command
 *
 * Creates a new agent folder via the API.
 */
import { getApiUrl, getAdminApiKey } from '../shared/api-client.js';

interface CreateAgentResponse {
  agentName: string;
  displayName: string;
  description: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
}

export async function createAgent(entityId: string, agentName: string): Promise<void> {
  const apiUrl = getApiUrl();
  const adminKey = await getAdminApiKey();

  console.log(`Creating agent "${agentName}" for entity: ${entityId}`);

  const response = await fetch(`${apiUrl}/admin/entities/${entityId}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': adminKey,
    },
    body: JSON.stringify({ agentName }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create agent: ${response.status} ${error}`);
  }

  const result: CreateAgentResponse = (await response.json()) as CreateAgentResponse;

  console.log('\nAgent created successfully!');
  console.log(`  Agent Name: ${result.agentName}`);
  console.log(`  Display Name: ${result.displayName}`);
  console.log(`  Entity ID: ${result.entityId}`);
  console.log(`  Description: ${result.description}`);
  console.log(`  Created: ${result.createdAt}`);
}