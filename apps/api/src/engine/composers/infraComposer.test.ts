import type { GenerateConfig } from '@node-initializr/shared';
import { describe, expect, it } from 'vitest';

import { composeInfraFiles } from './infraComposer.js';

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

describe('InfraComposer', () => {
  it('nao deve gerar arquivos quando docker nao esta selecionado', () => {
    const files = composeInfraFiles(baseConfig);

    expect(files).toEqual([]);
  });

  it('deve gerar Dockerfile e docker-compose.yml quando docker esta selecionado', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      dependencies: ['docker'],
    });

    expect(files.map((file) => file.path)).toEqual(['Dockerfile', 'docker-compose.yml']);
  });

  it('Dockerfile deve usar Node 20 e multi-stage', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      dependencies: ['docker'],
    });

    const dockerfile = files.find((file) => file.path === 'Dockerfile');

    expect(dockerfile?.content).toContain('FROM node:20-alpine AS deps');
    expect(dockerfile?.content).toContain('FROM node:20-alpine AS runner');
  });

  it('Dockerfile deve usar comandos npm quando packageManager e npm', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      packageManager: 'npm',
      dependencies: ['docker'],
    });

    const dockerfile = files.find((file) => file.path === 'Dockerfile');

    expect(dockerfile?.content).toContain('RUN npm ci');
    expect(dockerfile?.content).toContain('RUN npm run build');
    expect(dockerfile?.content).toContain('CMD ["npm","run","start"]');
  });

  it('Dockerfile deve usar comandos yarn quando packageManager e yarn', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      packageManager: 'yarn',
      dependencies: ['docker'],
    });

    const dockerfile = files.find((file) => file.path === 'Dockerfile');

    expect(dockerfile?.content).toContain('RUN corepack enable && yarn install --frozen-lockfile');
    expect(dockerfile?.content).toContain('RUN yarn build');
    expect(dockerfile?.content).toContain('CMD ["yarn","start"]');
  });

  it('docker-compose deve incluir servico api', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).toContain('api:');
    expect(compose?.content).toContain('build:');
  });

  it('docker-compose deve incluir postgres quando database e postgresql', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      database: 'postgresql',
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).toContain('postgres:');
    expect(compose?.content).toContain('POSTGRES_DB');
  });

  it('docker-compose deve incluir mysql quando database e mysql', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      database: 'mysql',
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).toContain('mysql:');
    expect(compose?.content).toContain('MYSQL_DATABASE');
  });

  it('docker-compose deve incluir mongodb quando database e mongodb', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      database: 'mongodb',
      orm: 'mongoose',
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).toContain('mongodb:');
    expect(compose?.content).toContain('MONGO_INITDB_DATABASE');
  });

  it('docker-compose nao deve incluir servico de banco quando database e none', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      database: 'none',
      orm: 'none',
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).not.toContain('postgres:');
    expect(compose?.content).not.toContain('mysql:');
    expect(compose?.content).not.toContain('mongodb:');
  });

  it('docker-compose deve incluir redis quando redis esta nas dependencies', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      dependencies: ['docker', 'redis'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).toContain('redis:');
    expect(compose?.content).toContain('redis:7-alpine');
  });

  it('docker-compose nao deve incluir redis quando redis nao esta nas dependencies', () => {
    const files = composeInfraFiles({
      ...baseConfig,
      dependencies: ['docker'],
    });

    const compose = files.find((file) => file.path === 'docker-compose.yml');

    expect(compose?.content).not.toContain('redis:');
  });
});
