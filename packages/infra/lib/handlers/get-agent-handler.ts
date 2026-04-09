/**
 * Get Agent Handler
 *
 * Gets full agent context (all sections) from S3.
 * GET /api/entities/{entityId}/agents/{agentName}
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // TODO: Epic 4 - Implement actual S3 retrieval logic
  // 1. Get accountId from API key in headers
  // 2. Get entityId and agentName from path parameters
  // 3. Get metadata.json from S3
  // 4. Get all sections (personality/*.md, skills/*.md, rules/*.md)
  // 5. Return full agent context

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metadata: {},
      sections: {
        personality: [],
        skills: [],
        rules: [],
      },
    }),
  };
};