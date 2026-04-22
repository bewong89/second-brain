/**
 * List Entities Handler
 *
 * Lists all entities for an authenticated account.
 * GET /api/entities
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from '../services/s3.js';
import { authenticate, AuthenticationError } from '../services/auth.js';

/**
 * Lambda handler for listing entities
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
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

    // Create S3 service and list entities
    const s3Service = new S3Service({}, bucket);
    const entities = await s3Service.listEntityFolders(accountId);

    // Return the list of entities
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entities }),
    };
  } catch (error) {
    console.error('Error listing entities:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};