import { render, screen } from '@testing-library/react';
import type { GenerateConfig } from '@node-initializr/shared';
import { describe, expect, it } from 'vitest';

import { FileTree } from './FileTree';
import { buildFileTree } from './fileTreeModel';

const baseConfig: GenerateConfig = {
  name: 'my-node-app',
  packageManager: 'npm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'none',
  orm: 'none',
  auth: 'none',
  messaging: 'none',
  dependencies: [],
};

describe('buildFileTree', () => {
  it('deve agrupar arquivos de lib em um unico diretorio', () => {
    const tree = buildFileTree({
      ...baseConfig,
      database: 'postgresql',
      orm: 'prisma',
      auth: 'jwt',
    });

    const src = tree.find((node) => node.name === 'src');
    const libDirectories = src?.children?.filter((node) => node.name === 'lib') ?? [];
    const lib = libDirectories[0];

    expect(libDirectories).toHaveLength(1);
    expect(lib?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'prisma.ts' }),
        expect.objectContaining({ name: 'jwt.ts' }),
      ]),
    );
  });
  it('deve gerar estrutura base', () => {
    const tree = buildFileTree(baseConfig);

    expect(tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'src', type: 'directory' }),
        expect.objectContaining({ name: 'package.json', type: 'file' }),
        expect.objectContaining({ name: '.env.example', type: 'file' }),
        expect.objectContaining({ name: '.gitignore', type: 'file' }),
      ]),
    );
  });

  it('deve incluir prisma/schema.prisma quando orm e prisma', () => {
    const tree = buildFileTree({
      ...baseConfig,
      database: 'postgresql',
      orm: 'prisma',
    });

    const prisma = tree.find((node) => node.name === 'prisma');

    expect(prisma).toBeDefined();
    expect(prisma?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'schema.prisma' })]),
    );
  });

  it('deve incluir Dockerfile e docker-compose quando docker esta selecionado', () => {
    const tree = buildFileTree({
      ...baseConfig,
      dependencies: ['docker'],
    });

    expect(tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Dockerfile', type: 'file' }),
        expect.objectContaining({ name: 'docker-compose.yml', type: 'file' }),
      ]),
    );
  });

  it('deve usar extensao .ts quando language e typescript', () => {
    const tree = buildFileTree({
      ...baseConfig,
      language: 'typescript',
    });

    const src = tree.find((node) => node.name === 'src');

    expect(src?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app.ts' }),
        expect.objectContaining({ name: 'server.ts' }),
      ]),
    );
  });

  it('deve usar extensao .js quando language e javascript', () => {
    const tree = buildFileTree({
      ...baseConfig,
      language: 'javascript',
    });

    const src = tree.find((node) => node.name === 'src');

    expect(src?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app.js' }),
        expect.objectContaining({ name: 'server.js' }),
      ]),
    );
  });
});

describe('FileTree', () => {
  it('deve renderizar estrutura base', () => {
    render(<FileTree config={baseConfig} />);

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
    expect(screen.getByText('.env.example')).toBeInTheDocument();
    expect(screen.getByText('.gitignore')).toBeInTheDocument();
  });

  it('deve renderizar prisma quando orm e prisma', () => {
    render(
      <FileTree
        config={{
          ...baseConfig,
          database: 'postgresql',
          orm: 'prisma',
        }}
      />,
    );

    expect(screen.getByText('prisma')).toBeInTheDocument();
    expect(screen.getByText('schema.prisma')).toBeInTheDocument();
  });

  it('deve renderizar Dockerfile quando docker esta selecionado', () => {
    render(
      <FileTree
        config={{
          ...baseConfig,
          dependencies: ['docker'],
        }}
      />,
    );

    expect(screen.getByText('Dockerfile')).toBeInTheDocument();
    expect(screen.getByText('docker-compose.yml')).toBeInTheDocument();
  });

  it('deve renderizar extensoes conforme linguagem', () => {
    render(
      <FileTree
        config={{
          ...baseConfig,
          language: 'javascript',
        }}
      />,
    );

    expect(screen.getByText('app.js')).toBeInTheDocument();
    expect(screen.getByText('server.js')).toBeInTheDocument();
    expect(screen.queryByText('app.ts')).not.toBeInTheDocument();
  });
});
