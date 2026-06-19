import type { GenerateConfig } from '@node-initializr/shared';
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateProject } from './index.js';

const validConfig: GenerateConfig = {
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

describe('generateProject', () => {
  afterEach(() => {
    vi.doUnmock('./resolver.js');
    vi.resetModules();
  });
  it('deve retornar um Buffer de zip para config valida', async () => {
    const zipBuffer = await generateProject(validConfig);

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    expect(zipBuffer.length).toBeGreaterThan(0);
  });

  it('deve rejeitar config invalida', async () => {
    await expect(
      generateProject({
        ...validConfig,
        database: 'none',
        orm: 'prisma',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_COMBINATION',
    });
  });

  it('deve incluir package.json no zip gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageJson = await zip.file('package.json')?.async('string');

    expect(packageJson).toBeDefined();
    expect(packageJson).toContain('meu-projeto');
  });

  it('deve incluir Dockerfile quando docker esta selecionado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const dockerfile = await zip.file('Dockerfile')?.async('string');

    expect(dockerfile).toBeDefined();
    expect(dockerfile).toContain('FROM node:20-alpine AS deps');
  });

  it('deve rejeitar falha interna como GENERATION_FAILED', async () => {
    vi.doMock('./resolver.js', () => ({
      resolveFragments: (): never => {
        throw new Error('resolver failure');
      },
    }));

    const { generateProject: generateProjectWithFailingResolver } = await import('./index.js');

    await expect(generateProjectWithFailingResolver(validConfig)).rejects.toMatchObject({
      code: 'GENERATION_FAILED',
    });
  });

  it('deve incluir arquivos base typescript no zip gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('tsconfig.json')).toBeDefined();
    expect(zip.file('.gitignore')).toBeDefined();
    expect(zip.file('.env.example')).toBeDefined();
  });

  it('deve incluir arquivos base javascript quando language e javascript', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      language: 'javascript',
    });
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('.gitignore')).toBeDefined();
    expect(zip.file('.env.example')).toBeDefined();
    expect(zip.file('tsconfig.json')).toBeNull();
  });
});
