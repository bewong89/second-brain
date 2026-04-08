/**
 * Agent metadata type definitions
 */

/**
 * Metadata for an AI agent
 */
export interface AgentMetadata {
  /** Unique agent identifier (folder name) */
  agentName: string;
  /** Human-readable display name */
  displayName: string;
  /** Agent description */
  description: string;
  /** ISO 8601 timestamp when agent was created */
  createdAt: string;
  /** ISO 8601 timestamp when agent was last updated */
  updatedAt: string;
}