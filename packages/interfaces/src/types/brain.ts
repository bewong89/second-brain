/**
 * Brain Content Type Interfaces
 *
 * Defines the structure for brain content hierarchy:
 * Entity -> Agent -> Section -> File
 */

export interface BrainFile {
  /** The filename of the markdown file */
  filename: string;
  /** The content of the markdown file */
  content: string;
}

export interface BrainSection {
  /** The name of the section (e.g., personality, skills, rules) */
  name: string;
  /** Array of files in this section */
  files: BrainFile[];
}

export interface BrainAgent {
  /** The identifier of the agent */
  agentId: string;
  /** The name of the agent */
  name: string;
  /** Array of sections belonging to this agent */
  sections: BrainSection[];
}

export interface BrainEntity {
  /** The identifier of the entity */
  entityId: string;
  /** The name of the entity */
  name: string;
  /** Array of agents belonging to this entity */
  agents: BrainAgent[];
}