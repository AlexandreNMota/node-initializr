import type { GenerateConfig } from '@node-initializr/shared';
import { describe, expect, it } from 'vitest';

import { checkCompatibility } from './compatibility.ts';

const baseConfig: GenerateConfig = {
  name: 'meu-projeto',
  packageManager: 'pnpm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'postgresql',
  orm: 'prisma',
  auth: 'jwt',
  messaging: 'none',
  dependencies: [],
};

describe('checkCompatibility - sem erros', () => {
  it('deve retornar [] para config totalmente valida', () => {
    expect(checkCompatibility(baseConfig)).toEqual([]);
  });

  it('deve retornar [] sem banco e sem ORM', () => {
    expect(checkCompatibility({ ...baseConfig, database: 'none', orm: 'none' })).toEqual([]);
  });
});

describe('checkCompatibility - erros de ORM', () => {
  it('deve retornar erro quando ORM e selecionado sem banco', () => {
    const errors = checkCompatibility({ ...baseConfig, database: 'none', orm: 'prisma' });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('orm');
  });

  it('deve retornar erro para mongoose com postgresql', () => {
    const errors = checkCompatibility({ ...baseConfig, database: 'postgresql', orm: 'mongoose' });

    expect(errors[0]?.field).toBe('orm');
  });

  it('deve retornar erro para drizzle com mongodb', () => {
    const errors = checkCompatibility({ ...baseConfig, database: 'mongodb', orm: 'drizzle' });

    expect(errors[0]?.field).toBe('orm');
  });
});

describe('checkCompatibility - erros de messaging', () => {
  it('deve retornar erro para bullmq sem redis', () => {
    const errors = checkCompatibility({
      ...baseConfig,
      messaging: 'bullmq',
      dependencies: [],
    });

    expect(errors[0]?.field).toBe('messaging');
  });

  it('nao deve retornar erro para bullmq com redis', () => {
    const errors = checkCompatibility({
      ...baseConfig,
      messaging: 'bullmq',
      dependencies: ['redis'],
    });

    expect(errors).toEqual([]);
  });
});

describe('checkCompatibility - multiplas violacoes', () => {
  it('deve retornar multiplos erros quando ha mais de uma violacao', () => {
    const errors = checkCompatibility({
      ...baseConfig,
      database: 'none',
      orm: 'prisma',
      messaging: 'bullmq',
      dependencies: [],
    });

    expect(errors.length).toBeGreaterThan(1);
  });
});