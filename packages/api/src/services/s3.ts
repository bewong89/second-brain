/**
 * S3 Service for brain content storage
 *
 * Provides methods to list and retrieve brain content from S3:
 * s3://brain-{accountId}/{entityId}/agents/{agentName}/{section}/{filename}.md
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  EntityMetadata,
  AgentMetadata,
  BrainAgent,
  BrainSection,
  BrainFile,
} from '@second-brain/interfaces';
import { EntitySection, ENTITY_SECTIONS } from '@second-brain/interfaces';

const BUCKET_PREFIX = 'brain-';

/**
 * S3 Service class for brain content operations
 */
export class S3Service {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private bucket: string;

  /**
   * Create a new S3Service instance
   * @param config - AWS S3 client configuration
   * @param bucket - S3 bucket name
   */
  constructor(config: S3ClientConfig, bucket: string) {
    this.client = new S3Client(config);
    this.bucket = bucket;
  }

  /**
   * Get bucket name for an account
   */
  private getAccountBucket(accountId: string): string {
    return `${BUCKET_PREFIX}${accountId}`;
  }

  /**
   * List all entity folders for an account
   * @param accountId - The account ID
   * @returns Array of entity metadata
   */
  async listEntityFolders(accountId: string): Promise<EntityMetadata[]> {
    const bucketName = this.getAccountBucket(accountId);

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Delimiter: '/',
    });

    const response = await this.client.send(command);

    const entities: EntityMetadata[] = [];

    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        const prefixPath = prefix.Prefix;
        if (!prefixPath) continue;

        // Parse entity folder from prefix (format: {entityId}/)
        const entityId = prefixPath.replace('/', '');

        // Get metadata.json from entity folder
        const metadata = await this.getEntityMetadata(entityId);
        if (metadata) {
          entities.push(metadata);
        }
      }
    }

    return entities;
  }

  /**
   * Get metadata.json from entity folder
   * @param entityId - The entity ID
   * @returns Entity metadata or null if not found
   */
  async getEntityMetadata(entityId: string): Promise<EntityMetadata | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: `${entityId}/metadata.json`,
    });

    try {
      const response = await this.client.send(command);
      const bodyString = await response.Body?.transformToString();
      if (!bodyString) return null;
      return JSON.parse(bodyString) as EntityMetadata;
    } catch {
      return null;
    }
  }

  /**
   * List agent folders within an entity
   * @param entityId - The entity ID
   * @returns Array of agent metadata
   */
  async listAgents(entityId: string): Promise<AgentMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: `${entityId}/agents/`,
      Delimiter: '/',
    });

    const response = await this.client.send(command);

    const agents: AgentMetadata[] = [];

    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        const prefixPath = prefix.Prefix;
        if (!prefixPath) continue;

        const parts = prefixPath.split('/');
        if (parts.length >= 3) {
          const agentName = parts[2];
          if (!agentName) continue;
          const metadata = await this.getAgentMetadata(entityId, agentName);
          if (metadata) {
            agents.push(metadata);
          }
        }
      }
    }

    return agents;
  }

  /**
   * Get agent metadata.json
   * @param entityId - The entity ID
   * @param agentName - The agent name (folder name)
   * @returns Agent metadata or null if not found
   */
  async getAgentMetadata(
    entityId: string,
    agentName: string
  ): Promise<AgentMetadata | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: `${entityId}/agents/${agentName}/metadata.json`,
    });

    try {
      const response = await this.client.send(command);
      const bodyString = await response.Body?.transformToString();
      if (!bodyString) return null;
      return JSON.parse(bodyString) as AgentMetadata;
    } catch {
      return null;
    }
  }

  /**
   * List .md files in a section
   * @param entityId - The entity ID
   * @param agentName - The agent name
   * @param section - The section name
   * @returns Array of file names
   */
  async listSectionFiles(
    entityId: string,
    agentName: string,
    section: EntitySection
  ): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: `${entityId}/agents/${agentName}/${section}/`,
      Delimiter: '/',
    });

    const response = await this.client.send(command);

    const files: string[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        const key = object.Key;
        if (!key) continue;

        // Parse filename from key (format: {entityId}/agents/{agentName}/{section}/{filename}.md)
        const filename = key.split('/').pop();
        if (filename && filename.endsWith('.md')) {
          files.push(filename.replace('.md', ''));
        }
      }
    }

    return files;
  }

  /**
   * Get content of a markdown file
   * @param entityId - The entity ID
   * @param agentName - The agent name
   * @param section - The section name
   * @param fileName - The filename (without .md extension)
   * @returns File content
   */
  async getFileContent(
    entityId: string,
    agentName: string,
    section: EntitySection,
    fileName: string
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: `${entityId}/agents/${agentName}/${section}/${fileName}.md`,
    });

    const response = await this.client.send(command);
    const bodyString = await response.Body?.transformToString();
    return bodyString || '';
  }

  /**
   * Get a presigned URL for a file
   * @param entityId - The entity ID
   * @param agentName - The agent name
   * @param section - The section name
   * @param fileName - The filename (without .md extension)
   * @param expiresIn - URL expiration time in seconds
   * @returns Presigned URL
   */
  async getFileUrl(
    entityId: string,
    agentName: string,
    section: EntitySection,
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const command: any = new GetObjectCommand({
      Bucket: this.bucket,
      Key: `${entityId}/agents/${agentName}/${section}/${fileName}.md`,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getSignedUrl(this.client as any, command, { expiresIn });
  }

  /**
   * Get full agent with all sections
   * @param entityId - The entity ID
   * @param agentName - The agent name
   * @returns Full brain agent with all sections and files
   */
  async getFullAgent(
    entityId: string,
    agentName: string
  ): Promise<BrainAgent | null> {
    const metadata = await this.getAgentMetadata(entityId, agentName);
    if (!metadata) return null;

    const sections: BrainSection[] = [];

    for (const section of ENTITY_SECTIONS) {
      const fileNames = await this.listSectionFiles(entityId, agentName, section);
      const files: BrainFile[] = [];

      for (const fileName of fileNames) {
        const content = await this.getFileContent(
          entityId,
          agentName,
          section,
          fileName
        );
        files.push({ filename: `${fileName}.md`, content });
      }

      sections.push({ name: section, files });
    }

    return {
      agentId: agentName,
      name: metadata.displayName,
      sections,
    };
  }
}