import type { GenerateConfig } from '@node-initializr/shared';
import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { resolveFragments } from './resolver.ts';

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

describe('Resolver - fragmento base', () => {
  it('deve incluir base/typescript para language typescript', () => {
    const fragments = resolveFragments(baseConfig);

    expect(fragments[0]?.id).toBe('base/typescript');
  });

  it('deve incluir base/javascript para language javascript', () => {
    const fragments = resolveFragments({ ...baseConfig, language: 'javascript' });

    expect(fragments[0]?.id).toBe('base/javascript');
  });
});

describe('Resolver - framework', () => {
  it('deve incluir fragmento do framework selecionado', () => {
    const fragments = resolveFragments({ ...baseConfig, framework: 'fastify' });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids).toContain('frameworks/fastify');
  });

  it('nao deve incluir fragmentos de frameworks nao selecionados', () => {
    const fragments = resolveFragments({ ...baseConfig, framework: 'express' });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids).not.toContain('frameworks/fastify');
    expect(ids).not.toContain('frameworks/nestjs');
  });
});

describe('Resolver - ORM', () => {
  it('deve incluir fragmento do ORM selecionado', () => {
    const fragments = resolveFragments({ ...baseConfig, orm: 'prisma' });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids).toContain('orms/prisma');
  });

  it('nao deve incluir fragmento de ORM quando orm e none', () => {
    const fragments = resolveFragments({ ...baseConfig, orm: 'none', database: 'none' });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids.some((id) => id.startsWith('orms/'))).toBe(false);
  });

  it('deve incluir mongoose para orm mongoose', () => {
    const fragments = resolveFragments({
      ...baseConfig,
      database: 'mongodb',
      orm: 'mongoose',
    });

    expect(fragments.map((fragment) => fragment.id)).toContain('orms/mongoose');
  });
});

describe('Resolver - auth', () => {
  it('deve incluir fragmento jwt quando auth e jwt', () => {
    const fragments = resolveFragments({ ...baseConfig, auth: 'jwt' });

    expect(fragments.map((fragment) => fragment.id)).toContain('auth/jwt');
  });

  it('nao deve incluir fragmento de auth quando auth e none', () => {
    const fragments = resolveFragments({ ...baseConfig, auth: 'none' });

    expect(fragments.map((fragment) => fragment.id).some((id) => id.startsWith('auth/'))).toBe(
      false,
    );
  });
});

describe('Resolver - dependencias adicionais', () => {
  it('deve incluir fragmentos de todas as dependencias selecionadas', () => {
    const fragments = resolveFragments({
      ...baseConfig,
      dependencies: ['docker', 'swagger', 'jest'],
    });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids).toContain('deps/docker');
    expect(ids).toContain('deps/swagger');
    expect(ids).toContain('deps/jest');
  });

  it('nao deve incluir fragmentos de dependencias nao selecionadas', () => {
    const fragments = resolveFragments({ ...baseConfig, dependencies: [] });
    const ids = fragments.map((fragment) => fragment.id);

    expect(ids).not.toContain('deps/docker');
    expect(ids).not.toContain('deps/redis');
  });
});

describe('Resolver - ordenacao', () => {
  it('deve retornar fragmentos ordenados por prioridade', () => {
    const fragments = resolveFragments({
      ...baseConfig,
      dependencies: ['docker'],
    });
    const priorities = fragments.map((fragment) => fragment.priority);
    const sortedPriorities = [...priorities].sort((a, b) => a - b);

    expect(priorities).toEqual(sortedPriorities);
  });

  it('base deve ter menor prioridade numerica que infra', () => {
    const fragments = resolveFragments({
      ...baseConfig,
      dependencies: ['docker'],
    });

    const base = fragments.find((fragment) => fragment.id.startsWith('base/'));
    const docker = fragments.find((fragment) => fragment.id === 'deps/docker');

    expect(base?.priority).toBeLessThan(docker?.priority ?? Number.POSITIVE_INFINITY);
  });
});

describe('Resolver - integridade dos fragmentos', () => {
  it('cada fragmento deve ter id, path, manifest e priority', () => {
    const fragments = resolveFragments(baseConfig);

    for (const fragment of fragments) {
      expect(fragment.id).toBeTruthy();
      expect(fragment.path).toBeTruthy();
      expect(fragment.manifest).toBeTruthy();
      expect(typeof fragment.priority).toBe('number');
    }
  });

  it('o path de cada fragmento deve existir no disco', () => {
    const fragments = resolveFragments(baseConfig);

    for (const fragment of fragments) {
      expect(existsSync(fragment.path)).toBe(true);
    }
  });
});
