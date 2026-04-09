/**
 * Create Entity Handler
 *
 * Creates S3 folder + metadata.json.
 * POST /admin/entities
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual S3 creation logic
  // 1. Validate admin API key
  // 2. Parse request body for entity details
  // 3. Create S3 folder (empty object with / suffix)
  // 4. Upload metadata.json
  // 5. Return created entity

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId: '', accountId: '' }),
  };
};