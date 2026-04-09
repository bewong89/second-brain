/**
 * Create API Key Handler
 *
 * Generates and stores API key in DynamoDB.
 * POST /admin/api-keys
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual API key creation logic
  // 1. Validate admin API key
  // 2. Parse request body for accountId
  // 3. Generate random API key
  // 4. Hash the API key with SHA-256
  // 5. PutItem to apiKeys table (with hashed key, not raw)
  // 6. Return the raw API key exactly ONCE

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: '', apiKey: '' }),
  };
};