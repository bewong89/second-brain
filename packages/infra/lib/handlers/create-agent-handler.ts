/**
 * Create Agent Handler
 *
 * Creates S3 agent folder + metadata.json.
 * POST /admin/entities/{entityId}/agents
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual S3 creation logic
  // 1. Validate admin API key
  // 2. Get entityId from path parameters
  // 3. Parse request body for agent details
  // 4. Create S3 folder agent-{agent-name}/
  // 5. Upload metadata.json
  // 6. Return created agent

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentName: '', entityId: '' }),
  };
};