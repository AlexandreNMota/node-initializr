import type { GenerateConfig } from '@node-initializr/shared';

import type { GeneratedFile } from '../types.js';

export function composeInfraFiles(config: GenerateConfig): GeneratedFile[] {
  if (!config.dependencies.includes('docker')) {
    return [];
  }

  return [
    {
      path: 'Dockerfile',
      content: buildDockerfile(config),
      encoding: 'utf-8',
    },
    {
      path: 'docker-compose.yml',
      content: buildDockerCompose(config),
      encoding: 'utf-8',
    },
  ];
}

function buildDockerfile(config: GenerateConfig): string {
  const installCommand = getInstallCommand(config.packageManager);
  const buildCommand = getBuildCommand(config.packageManager);
  const startCommand = getStartCommand(config.packageManager);

  return [
    'FROM node:20-alpine AS deps',
    'WORKDIR /app',
    'COPY package.json ./',
    `RUN ${installCommand}`,
    '',
    'FROM node:20-alpine AS builder',
    'WORKDIR /app',
    'COPY --from=deps /app/node_modules ./node_modules',
    'COPY . .',
    `RUN ${buildCommand}`,
    '',
    'FROM node:20-alpine AS runner',
    'WORKDIR /app',
    'ENV NODE_ENV=production',
    'COPY --from=builder /app/package.json ./package.json',
    'COPY --from=builder /app/node_modules ./node_modules',
    'COPY --from=builder /app/dist ./dist',
    'EXPOSE 3000',
    `CMD ${JSON.stringify(startCommand)}`,
    '',
  ].join('\n');
}

function buildDockerCompose(config: GenerateConfig): string {
  const services = [
    'services:',
    '  api:',
    '    build:',
    '      context: .',
    '      dockerfile: Dockerfile',
    '    ports:',
    '      - "3000:3000"',
    '    env_file:',
    '      - .env',
  ];

  const dependencies = getServiceDependencies(config);

  if (dependencies.length > 0) {
    services.push('    depends_on:');

    for (const dependency of dependencies) {
      services.push(`      - ${dependency}`);
    }
  }

  services.push(...getDatabaseService(config));
  services.push(...getRedisService(config));

  return `${services.join('\n')}\n`;
}

function getServiceDependencies(config: GenerateConfig): string[] {
  const dependencies: string[] = [];

  if (config.database === 'postgresql') {
    dependencies.push('postgres');
  }

  if (config.database === 'mysql') {
    dependencies.push('mysql');
  }

  if (config.database === 'mongodb') {
    dependencies.push('mongodb');
  }

  if (config.dependencies.includes('redis')) {
    dependencies.push('redis');
  }

  return dependencies;
}

function getDatabaseService(config: GenerateConfig): string[] {
  if (config.database === 'postgresql') {
    return [
      '',
      '  postgres:',
      '    image: postgres:16-alpine',
      '    environment:',
      '      POSTGRES_DB: app',
      '      POSTGRES_USER: postgres',
      '      POSTGRES_PASSWORD: postgres',
      '    ports:',
      '      - "5432:5432"',
    ];
  }

  if (config.database === 'mysql') {
    return [
      '',
      '  mysql:',
      '    image: mysql:8',
      '    environment:',
      '      MYSQL_DATABASE: app',
      '      MYSQL_ROOT_PASSWORD: mysql',
      '    ports:',
      '      - "3306:3306"',
    ];
  }

  if (config.database === 'mongodb') {
    return [
      '',
      '  mongodb:',
      '    image: mongo:7',
      '    environment:',
      '      MONGO_INITDB_DATABASE: app',
      '    ports:',
      '      - "27017:27017"',
    ];
  }

  return [];
}

function getRedisService(config: GenerateConfig): string[] {
  if (!config.dependencies.includes('redis')) {
    return [];
  }

  return ['', '  redis:', '    image: redis:7-alpine', '    ports:', '      - "6379:6379"'];
}

function getInstallCommand(packageManager: GenerateConfig['packageManager']): string {
  if (packageManager === 'pnpm') {
    return 'corepack enable && pnpm install --frozen-lockfile';
  }

  if (packageManager === 'yarn') {
    return 'corepack enable && yarn install --frozen-lockfile';
  }

  return 'npm ci';
}

function getBuildCommand(packageManager: GenerateConfig['packageManager']): string {
  if (packageManager === 'pnpm') {
    return 'pnpm build';
  }

  if (packageManager === 'yarn') {
    return 'yarn build';
  }

  return 'npm run build';
}

function getStartCommand(packageManager: GenerateConfig['packageManager']): string[] {
  if (packageManager === 'pnpm') {
    return ['pnpm', 'start'];
  }

  if (packageManager === 'yarn') {
    return ['yarn', 'start'];
  }

  return ['npm', 'run', 'start'];
}
