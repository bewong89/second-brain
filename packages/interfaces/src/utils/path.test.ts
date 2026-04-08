import { describe, it, expect } from 'vitest';
import {
  buildEntityFolderName,
  parseEntityFolderName,
  buildAgentFolderName,
  parseAgentFolderName,
  validateAgentName,
} from './path.js';
import { EntityType } from '../enums/entity.js';

describe('buildEntityFolderName', () => {
  it('builds folder name for PERSONAL entity type', () => {
    expect(buildEntityFolderName(EntityType.PERSONAL, 'usr_001')).toBe('personal_usr_001');
  });

  it('normalizes entityId to lowercase', () => {
    expect(buildEntityFolderName(EntityType.PERSONAL, 'USR_001')).toBe('personal_usr_001');
  });

  it('throws when entityType is missing', () => {
    // @ts-expect-error - Testing invalid input
    expect(() => buildEntityFolderName()).toThrow('entityType is required');
  });

  it('throws when entityId is empty', () => {
    expect(() => buildEntityFolderName(EntityType.PERSONAL, '')).toThrow('entityId is required');
  });
});

describe('parseEntityFolderName', () => {
  it('parses valid folder name', () => {
    const result = parseEntityFolderName('personal_usr_001');
    expect(result.entityType).toBe(EntityType.PERSONAL);
    expect(result.entityId).toBe('usr_001');
  });

  it('handles uppercase entity type in folder name', () => {
    const result = parseEntityFolderName('PERSONAL_usr_001');
    expect(result.entityType).toBe(EntityType.PERSONAL);
  });

  it('throws when folder name is empty', () => {
    expect(() => parseEntityFolderName('')).toThrow('folderName is required');
  });

  it('throws when folder name format is invalid', () => {
    expect(() => parseEntityFolderName('invalid')).toThrow('Invalid entity folder name format');
  });

  it('throws when entity type is unknown', () => {
    expect(() => parseEntityFolderName('unknown_usr_001')).toThrow('Unknown entity type');
  });
});

describe('buildAgentFolderName', () => {
  it('builds agent folder name', () => {
    expect(buildAgentFolderName('my-agent')).toBe('agent-my-agent');
  });

  it('throws when agentName is empty', () => {
    expect(() => buildAgentFolderName('')).toThrow('agentName is required');
  });

  it('throws when agentName is invalid', () => {
    expect(() => buildAgentFolderName('invalid_name!')).toThrow('Invalid agent name');
  });
});

describe('parseAgentFolderName', () => {
  it('parses agent folder name', () => {
    const result = parseAgentFolderName('agent-my-agent');
    expect(result.agentName).toBe('my-agent');
  });

  it('throws when folder name is empty', () => {
    expect(() => parseAgentFolderName('')).toThrow('folderName is required');
  });

  it('throws when folder name does not start with agent-', () => {
    expect(() => parseAgentFolderName('my-agent')).toThrow('Invalid agent folder name format');
  });

  it('throws when agent name is empty after prefix', () => {
    expect(() => parseAgentFolderName('agent-')).toThrow('Agent folder name cannot be empty');
  });

  it('throws when agent name is invalid', () => {
    expect(() => parseAgentFolderName('agent-invalid!')).toThrow('Invalid agent name in folder');
  });
});

describe('validateAgentName', () => {
  it('returns true for valid agent name', () => {
    expect(validateAgentName('my-agent')).toBe(true);
  });

  it('returns true for single word', () => {
    expect(validateAgentName('agent')).toBe(true);
  });

  it('returns true for name with underscores', () => {
    expect(validateAgentName('my_agent')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(validateAgentName('')).toBe(false);
  });

  it('returns false for name starting with hyphen', () => {
    expect(validateAgentName('-agent')).toBe(false);
  });

  it('returns false for name ending with hyphen', () => {
    expect(validateAgentName('agent-')).toBe(false);
  });

  it('returns false for name with special characters', () => {
    expect(validateAgentName('agent!')).toBe(false);
  });
});

describe('roundtrip', () => {
  it('build and parse entity folder name', () => {
    const folderName = buildEntityFolderName(EntityType.PERSONAL, 'usr_001');
    const parsed = parseEntityFolderName(folderName);
    expect(parsed.entityType).toBe(EntityType.PERSONAL);
    expect(parsed.entityId).toBe('usr_001');
  });

  it('build and parse agent folder name', () => {
    const folderName = buildAgentFolderName('my-agent');
    const parsed = parseAgentFolderName(folderName);
    expect(parsed.agentName).toBe('my-agent');
  });
});