/**
 * Path utilities for S3 folder structure
 *
 * S3 Structure:
 * {bucket}/
 *   {internalId}-{entityType}-{entityId}/
 *     metadata.json
 *     agent-{agent-name}/
 *       metadata.json
 *       personality/*.md
 *       skills/*.md
 *       rules/*.md
 */

import { EntityType } from '../enums/entity.js';

/**
 * Build the S3 key prefix for an entity folder
 */
export function getEntityFolderKey(
  internalId: string,
  entityType: EntityType,
  entityId: string
): string {
  return `${internalId}-${entityType}-${entityId}`;
}

/**
 * Build the S3 key prefix for an agent folder within an entity
 */
export function getAgentFolderKey(agentName: string): string {
  return `agent-${agentName}`;
}

/**
 * Build the full S3 key for an agent within an entity
 */
export function getAgentKey(
  internalId: string,
  entityType: EntityType,
  entityId: string,
  agentName: string
): string {
  return `${getEntityFolderKey(internalId, entityType, entityId)}/${getAgentFolderKey(agentName)}`;
}

/**
 * Build the S3 key for a brain content file
 */
export function getBrainContentKey(
  internalId: string,
  entityType: EntityType,
  entityId: string,
  agentName: string,
  section: string,
  filename: string
): string {
  return `${getAgentKey(internalId, entityType, entityId, agentName)}/${section}/${filename}`;
}
