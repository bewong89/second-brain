/**
 * List Agents Handler
 *
 * Lists all agents for an entity.
 * GET /api/entities/:entityId/agents
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from '../services/s3.js';
import { authenticate, AuthenticationError } from '../services/auth.js';

const ENTITY_NOT_FOUND = 'Entity not found';
const UNAUTHORIZED_ENTITY = 'Not authorized to access this entity';

/**
 * Lambda handler for listing agents
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get entityId from path parameters
    const entityId = event.pathParameters?.entityId;

    if (!entityId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing entityId parameter' }),
      };
    }

    // Authenticate the request
    let authResult;
    try {
      authResult = await authenticate(event);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          statusCode: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }
      throw error;
    }

    // Get account ID from authenticated context
    const accountId = authResult.account.accountId;

    // Get S3 bucket from environment
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      console.error('S3_BUCKET_NAME not configured');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }

    // Create S3 service
    const s3Service = new S3Service({}, bucket);

    // Get entity metadata to verify ownership
    const entityMetadata = await s3Service.getEntityMetadata(entityId);

    if (!entityMetadata) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: ENTITY_NOT_FOUND }),
      };
    }

    // Verify that the authenticated account owns this entity
    if (entityMetadata.accountId !== accountId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: UNAUTHORIZED_ENTITY }),
      };
    }

    // List agents for the entity
    const agents = await s3Service.listAgents(entityId);

    // Return the list of agents
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents }),
    };
  } catch (error) {
    console.error('Error listing agents:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};