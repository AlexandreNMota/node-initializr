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
    manifest: {
      id: 'base/typescript',
      devDependencies: {
        typescript: '5.5.4',
        tsx: '4.19.2',
      },
      scripts: {
        dev: 'tsx watch src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
      },
      envVars: [
        {
          key: 'PORT',
          example: '3000',
          description: 'Porta HTTP da aplicacao',
          required: true,
        },
      ],
    },
  },
  'base/javascript': {
    id: 'base/javascript',
    path: createTemplatePath('base', 'javascript'),
    priority: 10,
    manifest: {
      id: 'base/javascript',
      envVars: [
        {
          key: 'PORT',
          example: '3000',
          description: 'Porta HTTP da aplicacao',
          required: true,
        },
      ],
    },
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
    path: createTemplatePath('frameworks', 'fastify'),
    priority: 20,
    manifest: {
      id: 'frameworks/fastify',
      dependencies: {
        fastify: '4.28.1',
      },
      scripts: {
        dev: 'tsx watch src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
      },
    },
  },
  'frameworks/nestjs': {
    id: 'frameworks/nestjs',
    path: createTemplatePath('frameworks', 'nestjs'),
    priority: 5,
    manifest: {
      id: 'frameworks/nestjs',
      dependencies: {
        '@nestjs/common': '10.3.10',
        '@nestjs/core': '10.3.10',
        '@nestjs/platform-express': '10.3.10',
        'reflect-metadata': '0.2.2',
        rxjs: '7.8.1',
      },
      scripts: {
        dev: 'tsx watch src/main.ts',
        build: 'tsc',
        start: 'node dist/main.js',
      },
    },
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
    path: createTemplatePath('orms', 'typeorm'),
    priority: 30,
    manifest: {
      id: 'orms/typeorm',
      dependencies: {
        typeorm: '0.3.20',
        'reflect-metadata': '0.2.2',
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
  'orms/drizzle': {
    id: 'orms/drizzle',
    path: createTemplatePath('orms', 'drizzle'),
    priority: 30,
    manifest: {
      id: 'orms/drizzle',
      dependencies: {
        'drizzle-orm': '0.31.4',
        pg: '8.12.0',
        mysql2: '3.10.2',
        'better-sqlite3': '11.1.2',
      },
      devDependencies: {
        'drizzle-kit': '0.22.8',
        '@types/pg': '8.11.6',
        '@types/better-sqlite3': '7.6.10',
      },
      scripts: {
        'db:generate': 'drizzle-kit generate',
        'db:migrate': 'drizzle-kit migrate',
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
    path: createTemplatePath('deps', 'redis'),
    priority: 50,
    manifest: {
      id: 'deps/redis',
      dependencies: {
        ioredis: '5.4.1',
      },
      envVars: [
        {
          key: 'REDIS_URL',
          example: 'redis://localhost:6379',
          description: 'URL de conexao com Redis',
          required: true,
        },
      ],
    },
  },
  'deps/swagger': {
    id: 'deps/swagger',
    path: createTemplatePath('deps', 'swagger'),
    priority: 50,
    manifest: {
      id: 'deps/swagger',
      dependencies: {
        'swagger-ui-express': '5.0.1',
      },
      devDependencies: {
        '@types/swagger-ui-express': '4.1.7',
      },
    },
  },
  'deps/jest': {
    id: 'deps/jest',
    path: createTemplatePath('deps', 'jest'),
    priority: 50,
    manifest: {
      id: 'deps/jest',
      devDependencies: {
        jest: '29.7.0',
        'ts-jest': '29.2.3',
        '@types/jest': '29.5.12',
      },
      scripts: {
        test: 'jest',
      },
    },
  },
  'deps/docker': {
    id: 'deps/docker',
    path: createFixturePath('deps-docker'),
    priority: 90,
    manifest: { id: 'deps/docker' },
  },
  'deps/github-actions': {
    id: 'deps/github-actions',
    path: createTemplatePath('deps', 'github-actions'),
    priority: 90,
    manifest: {
      id: 'deps/github-actions',
    },
  },
  'deps/eslint': {
    id: 'deps/eslint',
    path: createTemplatePath('deps', 'eslint'),
    priority: 50,
    manifest: {
      id: 'deps/eslint',
      devDependencies: {
        eslint: '9.30.1',
        '@eslint/js': '9.30.1',
        globals: '15.8.0',
        prettier: '3.3.3',
        'eslint-config-prettier': '9.1.0',
        'typescript-eslint': '8.35.1',
      },
      scripts: {
        lint: 'eslint .',
        format: 'prettier . --write',
        'format:check': 'prettier . --check',
      },
    },
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
