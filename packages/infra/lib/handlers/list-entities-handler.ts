/**
 * List Entities Handler
 *
 * Lists all entity folders for an account from S3.
 * GET /api/entities
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual S3 listing logic
  // 1. Get accountId from API key in headers
  // 2. List objects in S3 bucket with prefix {accountId}/
  // 3. Return list of entity folders

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entities: [] }),
  };
};