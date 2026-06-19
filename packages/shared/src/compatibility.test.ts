import type { GenerateConfig } from './types.js';
import { describe, expect, it } from 'vitest';

import { checkCompatibility } from './compatibility.js';

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

describe('checkCompatibility', () => {
  it('deve retornar lista vazia para config valida', () => {
    expect(checkCompatibility(baseConfig)).toEqual([]);
  });

  it('deve retornar multiplos erros para multiplas violacoes', () => {
    const errors = checkCompatibility({
      ...baseConfig,
      database: 'none',
      orm: 'prisma',
      messaging: 'bullmq',
      dependencies: [],
    });

    expect(errors).toHaveLength(2);
    expect(errors.map((error) => error.field)).toEqual(['orm', 'messaging']);
  });
});
