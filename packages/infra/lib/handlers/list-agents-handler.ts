/**
 * List Agents Handler
 *
 * Lists all agents in an entity folder from S3.
 * GET /api/entities/{entityId}/agents
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual S3 listing logic
  // 1. Get accountId from API key in headers
  // 2. Get entityId from path parameters
  // 3. List objects in S3 bucket with prefix {entityId}/agent-*
  // 4. Return list of agent folders

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents: [] }),
  };
};