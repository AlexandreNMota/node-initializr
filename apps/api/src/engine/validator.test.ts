import { describe, expect, it } from 'vitest';

import { validate } from './validator.js';

const baseConfig = {
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

describe('Validator - payload valido', () => {
  it('deve aceitar um payload completo e valido', () => {
    const result = validate(baseConfig);

    expect(result.success).toBe(true);
  });

  it('deve aceitar payload sem banco e sem ORM', () => {
    const result = validate({ ...baseConfig, database: 'none', orm: 'none' });

    expect(result.success).toBe(true);
  });

  it('deve aceitar payload sem auth', () => {
    const result = validate({ ...baseConfig, auth: 'none' });

    expect(result.success).toBe(true);
  });
});

describe('Validator - campos obrigatorios', () => {
  it('deve rejeitar payload sem name', () => {
    const rest = {
      packageManager: baseConfig.packageManager,
      framework: baseConfig.framework,
      language: baseConfig.language,
      architecture: baseConfig.architecture,
      database: baseConfig.database,
      orm: baseConfig.orm,
      auth: baseConfig.auth,
      messaging: baseConfig.messaging,
      dependencies: baseConfig.dependencies,
    };

    const result = validate(rest);

    expect(result.success).toBe(false);
  });

  it('deve rejeitar name com letras maiusculas', () => {
    const result = validate({ ...baseConfig, name: 'MeuProjeto' });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('name');
  });

  it('deve rejeitar name com espacos', () => {
    const result = validate({ ...baseConfig, name: 'meu projeto' });

    expect(result.success).toBe(false);
  });

  it('deve rejeitar name com mais de 64 caracteres', () => {
    const result = validate({ ...baseConfig, name: 'a'.repeat(65) });

    expect(result.success).toBe(false);
  });

  it('deve rejeitar framework desconhecido', () => {
    const result = validate({ ...baseConfig, framework: 'koa' });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('framework');
  });
});

describe('Validator - compatibilidade ORM e banco', () => {
  it('deve rejeitar ORM quando database e none', () => {
    const result = validate({ ...baseConfig, database: 'none', orm: 'prisma' });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('orm');
  });

  it('deve rejeitar mongoose com postgresql', () => {
    const result = validate({ ...baseConfig, database: 'postgresql', orm: 'mongoose' });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('orm');
  });

  it('deve rejeitar drizzle com mongodb', () => {
    const result = validate({ ...baseConfig, database: 'mongodb', orm: 'drizzle' });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('orm');
  });

  it('deve aceitar mongoose com mongodb', () => {
    const result = validate({ ...baseConfig, database: 'mongodb', orm: 'mongoose' });

    expect(result.success).toBe(true);
  });

  it('deve aceitar prisma com postgresql', () => {
    const result = validate({ ...baseConfig, database: 'postgresql', orm: 'prisma' });

    expect(result.success).toBe(true);
  });

  it('deve aceitar prisma com sqlite', () => {
    const result = validate({ ...baseConfig, database: 'sqlite', orm: 'prisma' });

    expect(result.success).toBe(true);
  });
});

describe('Validator - compatibilidade messaging', () => {
  it('deve rejeitar bullmq sem redis', () => {
    const result = validate({
      ...baseConfig,
      messaging: 'bullmq',
      dependencies: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('messaging');
  });

  it('deve aceitar bullmq com redis', () => {
    const result = validate({
      ...baseConfig,
      messaging: 'bullmq',
      dependencies: ['redis'],
    });

    expect(result.success).toBe(true);
  });

  it('deve aceitar rabbitmq sem redis', () => {
    const result = validate({
      ...baseConfig,
      messaging: 'rabbitmq',
      dependencies: [],
    });

    expect(result.success).toBe(true);
  });
});

describe('Validator - estrutura de erros', () => {
  it('deve retornar code e field no erro', () => {
    const result = validate({ ...baseConfig, database: 'none', orm: 'prisma' });

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
      field: 'orm',
    });
  });

  it('deve retornar details com multiplos erros de validacao', () => {
    const result = validate({
      ...baseConfig,
      name: 'Invalid Name!',
      database: 'none',
      orm: 'prisma',
    });

    expect(result.success).toBe(false);
    expect(result.error?.details?.length).toBeGreaterThan(1);
  });
});
