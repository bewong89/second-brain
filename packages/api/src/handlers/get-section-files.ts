/**
 * Get Section Files Handler
 *
 * Lists files in a section for an agent.
 * GET /api/entities/:entityId/agents/:agentName/sections/:section
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from '../services/s3.js';
import { authenticate, AuthenticationError } from '../services/auth.js';
import { EntitySection, ENTITY_SECTIONS } from '@second-brain/interfaces';

const ENTITY_NOT_FOUND = 'Entity not found';
const AGENT_NOT_FOUND = 'Agent not found';
const UNAUTHORIZED_ENTITY = 'Not authorized to access this entity';
const INVALID_SECTION = 'Invalid section. Must be one of: personality, skills, rules';

/**
 * Lambda handler for getting section files
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get path parameters
    const entityId = event.pathParameters?.entityId;
    const agentName = event.pathParameters?.agentName;
    const section = event.pathParameters?.section;

    if (!entityId || !agentName || !section) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Validate section parameter
    const sectionEnum = section.toUpperCase() as EntitySection;
    if (!ENTITY_SECTIONS.includes(sectionEnum as typeof ENTITY_SECTIONS[number])) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: INVALID_SECTION }),
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

    // Verify agent exists
    const agentMetadata = await s3Service.getAgentMetadata(entityId, agentName);
    if (!agentMetadata) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: AGENT_NOT_FOUND }),
      };
    }

    // List files in the section
    const files = await s3Service.listSectionFiles(
      entityId,
      agentName,
      sectionEnum as EntitySection
    );

    // Return the list of files
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: sectionEnum,
        files,
      }),
    };
  } catch (error) {
    console.error('Error getting section files:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};