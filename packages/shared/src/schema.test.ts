import { describe, expect, it } from 'vitest';

import { ConfigSchema } from './schema.js';

const validConfig = {
  name: 'meu-projeto',
  packageManager: 'pnpm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'postgresql',
  orm: 'prisma',
  auth: 'jwt',
  messaging: 'none',
  dependencies: ['docker', 'swagger'],
};

describe('ConfigSchema', () => {
  it('deve aceitar config valida', () => {
    expect(ConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('deve rejeitar nome fora de kebab-case', () => {
    expect(ConfigSchema.safeParse({ ...validConfig, name: 'Meu Projeto' }).success).toBe(false);
  });

  it('deve rejeitar ORM sem banco', () => {
    expect(
      ConfigSchema.safeParse({ ...validConfig, database: 'none', orm: 'prisma' }).success,
    ).toBe(false);
  });

  it('deve rejeitar bullmq sem redis', () => {
    expect(
      ConfigSchema.safeParse({ ...validConfig, messaging: 'bullmq', dependencies: [] }).success,
    ).toBe(false);
  });
});
