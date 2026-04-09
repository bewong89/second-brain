/**
 * Create Account Handler
 *
 * Creates account in DynamoDB.
 * POST /admin/accounts
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual DynamoDB creation logic
  // 1. Validate admin API key
  // 2. Parse request body for account details
  // 3. PutItem to accounts table
  // 4. Return created account

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: '', isAdmin: false }),
  };
};