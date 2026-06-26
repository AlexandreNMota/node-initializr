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

async function readZipEntries(zipBuffer: Buffer): Promise<Map<string, string>> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = new Map<string, string>();

  await Promise.all(
    Object.entries(zip.files).map(async ([fileName, file]) => {
      if (file.dir) {
        return;
      }

      entries.set(fileName, await file.async('string'));
    }),
  );

  return entries;
}
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

  it('deve incluir arquivos Express TypeScript no zip gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('src/app.ts')).toBeDefined();
    expect(zip.file('src/server.ts')).toBeDefined();
    expect(zip.file('src/routes/index.ts')).toBeDefined();
  });

  it('deve incluir arquivos Express JavaScript quando language e javascript', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      language: 'javascript',
    });
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('src/app.js')).toBeDefined();
    expect(zip.file('src/server.js')).toBeDefined();
    expect(zip.file('src/routes/index.js')).toBeDefined();
    expect(zip.file('src/app.ts')).toBeNull();
  });

  it('deve incluir express no package.json gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageJsonContent = await zip.file('package.json')?.async('string');

    expect(packageJsonContent).toBeDefined();

    const packageJson = JSON.parse(packageJsonContent ?? '{}') as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.dependencies.express).toBe('4.19.2');
    expect(packageJson.devDependencies['@types/express']).toBe('4.17.21');
  });
  it('deve incluir ferramentas TypeScript usadas pelos scripts no package.json gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageJsonContent = await zip.file('package.json')?.async('string');

    expect(packageJsonContent).toBeDefined();

    const packageJson = JSON.parse(packageJsonContent ?? '{}') as {
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };

    expect(packageJson.devDependencies.typescript).toBe('5.5.4');
    expect(packageJson.devDependencies.tsx).toBe('4.19.2');
    expect(packageJson.scripts.dev).toContain('tsx');
    expect(packageJson.scripts.build).toBe('tsc');
  });

  it('deve incluir arquivos Prisma TypeScript no zip gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('prisma/schema.prisma')).toBeDefined();
    expect(zip.file('src/lib/prisma.ts')).toBeDefined();
  });

  it('deve incluir arquivos Prisma JavaScript quando language e javascript', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      language: 'javascript',
    });
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('prisma/schema.prisma')).toBeDefined();
    expect(zip.file('src/lib/prisma.js')).toBeDefined();
    expect(zip.file('src/lib/prisma.ts')).toBeNull();
  });

  it('schema.prisma deve usar provider correto para mysql', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      database: 'mysql',
    });
    const zip = await JSZip.loadAsync(zipBuffer);
    const schema = await zip.file('prisma/schema.prisma')?.async('string');

    expect(schema).toContain('provider = "mysql"');
  });

  it('deve incluir Prisma no package.json gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageJsonContent = await zip.file('package.json')?.async('string');

    expect(packageJsonContent).toBeDefined();

    const packageJson = JSON.parse(packageJsonContent ?? '{}') as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };

    expect(packageJson.dependencies['@prisma/client']).toBe('5.14.0');
    expect(packageJson.devDependencies.prisma).toBe('5.14.0');
    expect(packageJson.scripts['db:migrate']).toBe('prisma migrate dev');
    expect(packageJson.scripts['db:generate']).toBe('prisma generate');
  });

  it('deve incluir DATABASE_URL no .env.example gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const envExample = await zip.file('.env.example')?.async('string');

    expect(envExample).toContain('DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app');
  });

  it('deve incluir arquivos JWT TypeScript no zip gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('src/lib/jwt.ts')).toBeDefined();
    expect(zip.file('src/middlewares/auth.ts')).toBeDefined();
  });

  it('deve incluir arquivos JWT JavaScript quando language e javascript', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      language: 'javascript',
    });
    const zip = await JSZip.loadAsync(zipBuffer);

    expect(zip.file('src/lib/jwt.js')).toBeDefined();
    expect(zip.file('src/middlewares/auth.js')).toBeDefined();
    expect(zip.file('src/lib/jwt.ts')).toBeNull();
    expect(zip.file('src/middlewares/auth.ts')).toBeNull();
  });

  it('deve incluir JWT no package.json gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageJsonContent = await zip.file('package.json')?.async('string');

    expect(packageJsonContent).toBeDefined();

    const packageJson = JSON.parse(packageJsonContent ?? '{}') as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.dependencies.jsonwebtoken).toBe('9.0.2');
    expect(packageJson.devDependencies['@types/jsonwebtoken']).toBe('9.0.6');
  });

  it('deve incluir variaveis JWT no .env.example gerado', async () => {
    const zipBuffer = await generateProject(validConfig);
    const zip = await JSZip.loadAsync(zipBuffer);
    const envExample = await zip.file('.env.example')?.async('string');

    expect(envExample).toContain('JWT_SECRET=change-me');
    expect(envExample).toContain('JWT_EXPIRES_IN=1d');
  });

  it('deve gerar projeto Fastify com arquivos e dependencia corretos', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      framework: 'fastify',
    });

    const entries = await readZipEntries(zipBuffer);
    const packageJson = JSON.parse(entries.get('package.json') ?? '{}') as {
      dependencies?: Record<string, string>;
    };

    expect(entries.has('src/app.ts')).toBe(true);
    expect(entries.has('src/server.ts')).toBe(true);
    expect(entries.has('src/routes/index.ts')).toBe(true);
    expect(entries.get('src/app.ts')).toContain("from 'fastify'");
    expect(packageJson.dependencies?.fastify).toBe('4.28.1');
  });

  it('deve gerar projeto NestJS com arquivos e dependencias corretos', async () => {
    const zipBuffer = await generateProject({
      ...validConfig,
      framework: 'nestjs',
    });

    const entries = await readZipEntries(zipBuffer);
    const packageJson = JSON.parse(entries.get('package.json') ?? '{}') as {
      dependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(entries.has('src/main.ts')).toBe(true);
    expect(entries.has('src/app.module.ts')).toBe(true);
    expect(entries.has('src/health.controller.ts')).toBe(true);
    expect(entries.get('src/main.ts')).toContain('@nestjs/core');
    expect(packageJson.dependencies?.['@nestjs/core']).toBe('10.3.10');
    expect(packageJson.dependencies?.['@nestjs/common']).toBe('10.3.10');
    expect(packageJson.dependencies?.['@nestjs/platform-express']).toBe('10.3.10');
    expect(packageJson.dependencies?.['reflect-metadata']).toBe('0.2.2');
    expect(packageJson.dependencies?.rxjs).toBe('7.8.1');
    expect(packageJson.scripts?.dev).toBe('tsx watch src/main.ts');
  });
});
