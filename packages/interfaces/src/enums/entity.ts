export enum EntityType {
  PERSONAL = 'PERSONAL',
}

export enum EntitySection {
  PERSONALITY = 'PERSONALITY',
  SKILLS = 'SKILLS',
  RULES = 'RULES',
}

export const ENTITY_SECTIONS = [
  EntitySection.PERSONALITY,
  EntitySection.SKILLS,
  EntitySection.RULES,
] as const;
