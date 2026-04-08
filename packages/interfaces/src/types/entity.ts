import { EntityType } from '../enums/entity.js';

export interface EntityMetadata {
  internalId: string;
  entityType: EntityType;
  entityId: string;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
