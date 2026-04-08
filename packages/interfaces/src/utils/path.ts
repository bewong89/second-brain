import { EntityType } from '../enums/entity.js';

/**
 * Regex pattern for validating agent names.
 * Matches: alphanumeric characters, hyphens, and underscores.
 * Must start and end with alphanumeric.
 */
const AGENT_NAME_PATTERN = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

/**
 * Entity folder name format: {entityType}_{entityId}
 * Example: personal_usr_001
 */
const ENTITY_FOLDER_PATTERN = /^([a-z]+)_([a-z0-9_]+)$/i;

export interface ParsedEntityFolderName {
  entityType: EntityType;
  entityId: string;
}

export interface ParsedAgentFolderName {
  agentName: string;
}

/**
 * Build folder name from entity type and entity ID.
 * Format: {entityType}_{entityId}
 * 
 * @param entityType - The entity type (e.g., EntityType.PERSONAL)
 * @param entityId - The entity ID (e.g., "usr_001")
 * @returns The folder name (e.g., "personal_usr_001")
 * @throws Error if entityType or entityId is invalid
 */
export function buildEntityFolderName(entityType: EntityType, entityId: string): string {
  if (!entityType) {
    throw new Error('entityType is required');
  }
  if (!entityId || entityId.trim() === '') {
    throw new Error('entityId is required');
  }
  
  // Normalize entityType to lowercase for the folder name
  const normalizedEntityType = entityType.toLowerCase();
  const normalizedEntityId = entityId.toLowerCase();
  
  return `${normalizedEntityType}_${normalizedEntityId}`;
}

/**
 * Parse an entity folder name to extract entity type and entity ID.
 * 
 * @param folderName - The folder name to parse (e.g., "personal_usr_001")
 * @returns Object containing entityType and entityId
 * @throws Error if folderName is invalid
 */
export function parseEntityFolderName(folderName: string): ParsedEntityFolderName {
  if (!folderName || folderName.trim() === '') {
    throw new Error('folderName is required');
  }
  
  const match = folderName.match(ENTITY_FOLDER_PATTERN);
  if (!match) {
    throw new Error(`Invalid entity folder name format: ${folderName}. Expected format: {entityType}_{entityId}`);
  }
  
  const entityTypeStr = match[1];
  const entityId = match[2];
  
  if (!entityTypeStr || !entityId) {
    throw new Error(`Invalid entity folder name format: ${folderName}. Expected format: {entityType}_{entityId}`);
  }
  
  // Convert entity type string to EntityType enum
  let entityType: EntityType;
  switch (entityTypeStr.toUpperCase()) {
    case 'PERSONAL':
      entityType = EntityType.PERSONAL;
      break;
    default:
      throw new Error(`Unknown entity type: ${entityTypeStr}`);
  }
  
  return { entityType, entityId };
}

/**
 * Build an agent folder name from an agent name.
 * Format: agent-{agentName}
 * 
 * @param agentName - The agent name
 * @returns The agent folder name
 * @throws Error if agentName is invalid
 */
export function buildAgentFolderName(agentName: string): string {
  if (!agentName || agentName.trim() === '') {
    throw new Error('agentName is required');
  }
  
  if (!validateAgentName(agentName)) {
    throw new Error(`Invalid agent name: ${agentName}. Agent name must match pattern: ${AGENT_NAME_PATTERN}`);
  }
  
  return `agent-${agentName}`;
}

/**
 * Parse an agent folder name to extract the agent name.
 * 
 * @param folderName - The folder name to parse (e.g., "agent-my-agent")
 * @returns Object containing agentName
 * @throws Error if folderName is invalid
 */
export function parseAgentFolderName(folderName: string): ParsedAgentFolderName {
  if (!folderName || folderName.trim() === '') {
    throw new Error('folderName is required');
  }
  
  const prefix = 'agent-';
  if (!folderName.startsWith(prefix)) {
    throw new Error(`Invalid agent folder name format: ${folderName}. Expected format: agent-{agentName}`);
  }
  
  const agentName = folderName.slice(prefix.length);
  
  if (!agentName) {
    throw new Error('Agent folder name cannot be empty after "agent-" prefix');
  }
  
  if (!validateAgentName(agentName)) {
    throw new Error(`Invalid agent name in folder: ${agentName}. Agent name must match pattern: ${AGENT_NAME_PATTERN}`);
  }
  
  return { agentName };
}

/**
 * Validate an agent name.
 * Agent names must:
 * - Contain only alphanumeric characters, hyphens, and underscores
 * - Start and end with an alphanumeric character
 * - Have at least 1 character
 * 
 * @param agentName - The agent name to validate
 * @returns True if valid, false otherwise
 */
export function validateAgentName(agentName: string): boolean {
  if (!agentName || agentName.trim() === '') {
    return false;
  }
  
  return AGENT_NAME_PATTERN.test(agentName);
}
