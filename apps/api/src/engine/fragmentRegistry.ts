import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Fragment } from './types.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const fixturesDirPath = path.join(currentDirPath, '__fixtures__');
const templatesDirPath = path.join(currentDirPath, '..', 'templates');
// type FragmentRegistryEntry = Omit<Fragment, 'manifest'> & {
//   manifest: Fragment['manifest'];
// };
type FragmentRegistryEntry = {
  id: string;
  path: string;
  priority: number;
  manifest: Fragment['manifest'];
};

function createFixturePath(name: string): string {
  return path.join(fixturesDirPath, name);
}

export const fragmentRegistry = {
  'base/typescript': {
    id: 'base/typescript',
    path: createTemplatePath('base', 'typescript'),
    priority: 10,
    manifest: { id: 'base/typescript' },
  },
  'base/javascript': {
    id: 'base/javascript',
    path: createTemplatePath('base', 'javascript'),
    priority: 10,
    manifest: { id: 'base/javascript' },
  },

  'frameworks/express': {
    id: 'frameworks/express',
    path: createTemplatePath('frameworks', 'express'),
    priority: 20,
    manifest: {
      id: 'frameworks/express',
      dependencies: {
        express: '4.19.2',
      },
      devDependencies: {
        '@types/express': '4.17.21',
      },
      scripts: {
        dev: 'tsx watch src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
      },
    },
  },
  'frameworks/fastify': {
    id: 'frameworks/fastify',
    path: createFixturePath('frameworks-fastify'),
    priority: 20,
    manifest: { id: 'frameworks/fastify' },
  },
  'frameworks/nestjs': {
    id: 'frameworks/nestjs',
    path: createFixturePath('frameworks-nestjs'),
    priority: 20,
    manifest: { id: 'frameworks/nestjs' },
  },
  'frameworks/hono': {
    id: 'frameworks/hono',
    path: createFixturePath('frameworks-hono'),
    priority: 20,
    manifest: { id: 'frameworks/hono' },
  },

  'orms/prisma': {
    id: 'orms/prisma',
    path: createTemplatePath('orms', 'prisma'),
    priority: 30,
    manifest: {
      id: 'orms/prisma',
      dependencies: {
        '@prisma/client': '5.14.0',
      },
      devDependencies: {
        prisma: '5.14.0',
      },
      scripts: {
        'db:migrate': 'prisma migrate dev',
        'db:generate': 'prisma generate',
      },
      envVars: [
        {
          key: 'DATABASE_URL',
          example: 'postgresql://postgres:postgres@localhost:5432/app',
          description: 'String de conexao com o banco de dados',
          required: true,
        },
      ],
    },
  },
  'orms/typeorm': {
    id: 'orms/typeorm',
    path: createFixturePath('orms-typeorm'),
    priority: 30,
    manifest: { id: 'orms/typeorm' },
  },
  'orms/drizzle': {
    id: 'orms/drizzle',
    path: createFixturePath('orms-drizzle'),
    priority: 30,
    manifest: { id: 'orms/drizzle' },
  },
  'orms/mongoose': {
    id: 'orms/mongoose',
    path: createFixturePath('orms-mongoose'),
    priority: 30,
    manifest: { id: 'orms/mongoose' },
  },

  'auth/jwt': {
    id: 'auth/jwt',
    path: createTemplatePath('auth', 'jwt'),
    priority: 40,
    manifest: {
      id: 'auth/jwt',
      dependencies: {
        jsonwebtoken: '9.0.2',
      },
      devDependencies: {
        '@types/jsonwebtoken': '9.0.6',
      },
      envVars: [
        {
          key: 'JWT_SECRET',
          example: 'change-me',
          description: 'Secret usado para assinar tokens JWT',
          required: true,
        },
        {
          key: 'JWT_EXPIRES_IN',
          example: '1d',
          description: 'Tempo de expiracao do token JWT',
          required: true,
        },
      ],
    },
  },
  'auth/clerk': {
    id: 'auth/clerk',
    path: createFixturePath('auth-clerk'),
    priority: 40,
    manifest: { id: 'auth/clerk' },
  },

  'deps/redis': {
    id: 'deps/redis',
    path: createFixturePath('deps-redis'),
    priority: 50,
    manifest: { id: 'deps/redis' },
  },
  'deps/swagger': {
    id: 'deps/swagger',
    path: createFixturePath('deps-swagger'),
    priority: 50,
    manifest: { id: 'deps/swagger' },
  },
  'deps/jest': {
    id: 'deps/jest',
    path: createFixturePath('deps-jest'),
    priority: 50,
    manifest: { id: 'deps/jest' },
  },
  'deps/docker': {
    id: 'deps/docker',
    path: createFixturePath('deps-docker'),
    priority: 90,
    manifest: { id: 'deps/docker' },
  },
  'deps/github-actions': {
    id: 'deps/github-actions',
    path: createFixturePath('deps-github-actions'),
    priority: 90,
    manifest: { id: 'deps/github-actions' },
  },
  'deps/eslint': {
    id: 'deps/eslint',
    path: createFixturePath('deps-eslint'),
    priority: 50,
    manifest: { id: 'deps/eslint' },
  },
  'deps/pino': {
    id: 'deps/pino',
    path: createFixturePath('deps-pino'),
    priority: 50,
    manifest: { id: 'deps/pino' },
  },
  'deps/winston': {
    id: 'deps/winston',
    path: createFixturePath('deps-winston'),
    priority: 50,
    manifest: { id: 'deps/winston' },
  },
} satisfies Record<string, FragmentRegistryEntry>;

export type FragmentId = keyof typeof fragmentRegistry;
function createTemplatePath(...segments: string[]): string {
  return path.join(templatesDirPath, ...segments);
}
